"""
In-memory async job queue for campaign email sending.

Design:
- No Redis dependency — runs in-process using asyncio and threading.
- Jobs are tracked in a dict so their status can be queried via API.
- A configurable number of worker tasks pull jobs from the queue.
- Each worker sends emails sequentially with rate limiting and updates
  Appwrite (recipients, campaign, analytics) directly.
- Thread pool is used for blocking SMTP calls.
"""

import asyncio
import logging
import time
import uuid
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Dict, Optional

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query as AppwriteQuery

from src.config import settings
from src.models import (
    JobStatus,
    SendCampaignRequest,
    JobStatusResponse,
    RecipientResult,
)
from src.services.email_service import EmailService

logger = logging.getLogger(__name__)

# Appwrite collection IDs (same as main backend)
CAMPAIGNS_COLLECTION = "newsletter-campaigns"
RECIPIENTS_COLLECTION = "newsletter-recipients"
ANALYTICS_COLLECTION = "campaign-analytics"


def _get_appwrite() -> Databases:
    """Create a fresh Appwrite Databases client."""
    client = Client()
    client.set_endpoint(settings.APPWRITE_ENDPOINT)
    client.set_project(settings.APPWRITE_PROJECT_ID)
    client.set_key(settings.APPWRITE_API_KEY)
    return Databases(client)


class CampaignJob:
    """Tracks state for one campaign send job."""

    def __init__(self, request: SendCampaignRequest):
        self.job_id: str = uuid.uuid4().hex[:16]
        self.campaign_id: str = request.campaign_id
        self.request: SendCampaignRequest = request
        self.status: JobStatus = JobStatus.QUEUED
        self.total: int = len(request.recipients)
        self.sent: int = 0
        self.failed: int = 0
        self.queued_at: datetime = datetime.now(timezone.utc)
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.error_message: Optional[str] = None

    @property
    def progress(self) -> float:
        if self.total == 0:
            return 100.0
        return round((self.sent + self.failed) / self.total * 100, 1)

    def to_status_response(self) -> JobStatusResponse:
        return JobStatusResponse(
            job_id=self.job_id,
            campaign_id=self.campaign_id,
            status=self.status,
            total_recipients=self.total,
            sent_count=self.sent,
            failed_count=self.failed,
            progress_percent=self.progress,
            started_at=self.started_at,
            completed_at=self.completed_at,
            error_message=self.error_message,
        )


class QueueManager:
    """
    Manages an async job queue with worker tasks.

    Usage:
        qm = QueueManager()
        await qm.start()       # starts workers
        job = qm.enqueue(req)   # returns CampaignJob
        qm.get_job(job_id)      # poll status
        await qm.shutdown()     # graceful stop
    """

    def __init__(self):
        self._queue: asyncio.Queue = None  # created in start()
        self._jobs: Dict[str, CampaignJob] = {}
        self._campaign_jobs: Dict[str, str] = {}  # campaign_id -> job_id
        self._workers: list = []
        self._running = False
        self._executor = ThreadPoolExecutor(max_workers=4)
        self._delay = 1.0 / max(settings.EMAILS_PER_SECOND, 0.1)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self):
        """Start worker tasks."""
        if self._running:
            return
        self._queue = asyncio.Queue()
        self._running = True
        n_workers = settings.MAX_CONCURRENT_CAMPAIGNS
        for i in range(n_workers):
            task = asyncio.create_task(self._worker(i))
            self._workers.append(task)
        logger.info(f"QueueManager started with {n_workers} workers, {settings.EMAILS_PER_SECOND} emails/s")

    async def shutdown(self):
        """Graceful shutdown."""
        self._running = False
        # Put sentinel None values so workers exit
        for _ in self._workers:
            await self._queue.put(None)
        await asyncio.gather(*self._workers, return_exceptions=True)
        self._executor.shutdown(wait=False)
        logger.info("QueueManager stopped")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def enqueue(self, request: SendCampaignRequest) -> CampaignJob:
        """Add a campaign to the send queue. Returns immediately."""
        job = CampaignJob(request)
        self._jobs[job.job_id] = job
        self._campaign_jobs[job.campaign_id] = job.job_id
        self._queue.put_nowait(job)
        logger.info(
            f"Enqueued job {job.job_id} for campaign {job.campaign_id} "
            f"({job.total} recipients)"
        )
        return job

    def get_job(self, job_id: str) -> Optional[CampaignJob]:
        return self._jobs.get(job_id)

    def get_job_by_campaign(self, campaign_id: str) -> Optional[CampaignJob]:
        jid = self._campaign_jobs.get(campaign_id)
        return self._jobs.get(jid) if jid else None

    def cancel_job(self, campaign_id: str) -> bool:
        """Cancel a queued (not yet processing) job."""
        job = self.get_job_by_campaign(campaign_id)
        if not job:
            return False
        if job.status == JobStatus.QUEUED:
            job.status = JobStatus.CANCELLED
            job.completed_at = datetime.now(timezone.utc)
            logger.info(f"Cancelled job {job.job_id} for campaign {campaign_id}")
            return True
        return False

    @property
    def queue_size(self) -> int:
        return self._queue.qsize() if self._queue else 0

    @property
    def active_count(self) -> int:
        return sum(1 for j in self._jobs.values() if j.status == JobStatus.PROCESSING)

    # ------------------------------------------------------------------
    # Worker loop
    # ------------------------------------------------------------------

    async def _worker(self, worker_id: int):
        """Worker task: pull jobs from queue and process them."""
        logger.info(f"Worker-{worker_id} started")
        while self._running:
            try:
                job: Optional[CampaignJob] = await asyncio.wait_for(
                    self._queue.get(), timeout=5.0
                )
            except asyncio.TimeoutError:
                continue

            if job is None:
                break  # shutdown sentinel

            if job.status == JobStatus.CANCELLED:
                self._queue.task_done()
                continue

            try:
                await self._process_job(job, worker_id)
            except Exception as e:
                logger.error(f"Worker-{worker_id} job {job.job_id} crashed: {e}", exc_info=True)
                job.status = JobStatus.FAILED
                job.error_message = str(e)
                job.completed_at = datetime.now(timezone.utc)
                await self._update_campaign_status(job, "failed")
            finally:
                self._queue.task_done()

        logger.info(f"Worker-{worker_id} stopped")

    async def _process_job(self, job: CampaignJob, worker_id: int):
        """Send all emails for one campaign job."""
        job.status = JobStatus.PROCESSING
        job.started_at = datetime.now(timezone.utc)
        req = job.request
        loop = asyncio.get_event_loop()

        logger.info(f"Worker-{worker_id}: Processing job {job.job_id} "
                     f"campaign={job.campaign_id} recipients={job.total}")

        email_svc = EmailService()
        try:
            for i, recip in enumerate(req.recipients):
                # Check if cancelled mid-flight
                if job.status == JobStatus.CANCELLED:
                    logger.info(f"Job {job.job_id} cancelled mid-send at {i}/{job.total}")
                    break

                # Prepare content (personalize, track, footer)
                prepared_html = email_svc.prepare_email(
                    html=req.content_html,
                    campaign_id=req.campaign_id,
                    list_id=req.list_id,
                    email=recip.email,
                    name=recip.name,
                )
                personalized_subject = email_svc._personalize_content(
                    req.subject, recip.email, recip.name
                )

                # Send in thread pool (SMTP is blocking)
                result = await loop.run_in_executor(
                    self._executor,
                    email_svc.send_email,
                    recip.email,
                    personalized_subject,
                    prepared_html,
                    req.sender_name,
                    req.reply_to_email,
                    req.sender_logo_url,
                )

                if result.get("success"):
                    job.sent += 1
                    await self._update_recipient(recip.recipient_doc_id, "sent")
                else:
                    job.failed += 1
                    err = result.get("error", "Unknown")
                    logger.warning(
                        f"Job {job.job_id}: failed {recip.email} – {err}"
                    )
                    await self._update_recipient(
                        recip.recipient_doc_id, "failed", err
                    )

                # Log progress every 10 emails
                if (i + 1) % 10 == 0 or i == job.total - 1:
                    logger.info(
                        f"Job {job.job_id}: {i+1}/{job.total} "
                        f"(sent={job.sent} failed={job.failed})"
                    )

                # Rate-limit delay
                if i < job.total - 1:
                    await asyncio.sleep(self._delay)

        finally:
            email_svc.close()

        # Finalize
        if job.status != JobStatus.CANCELLED:
            job.status = JobStatus.COMPLETED if job.sent > 0 else JobStatus.FAILED
        job.completed_at = datetime.now(timezone.utc)

        final_status = "sent" if job.sent > 0 else "failed"
        if job.status == JobStatus.CANCELLED:
            final_status = "cancelled"

        await self._update_campaign_status(job, final_status)
        await self._update_analytics(job)

        logger.info(
            f"Job {job.job_id} complete: status={job.status.value} "
            f"sent={job.sent} failed={job.failed}"
        )

    # ------------------------------------------------------------------
    # Appwrite callbacks (direct DB updates)
    # ------------------------------------------------------------------

    async def _update_recipient(
        self, doc_id: str, status: str, error_msg: str = ""
    ):
        """Update a single recipient document in Appwrite."""
        if not doc_id:
            return
        try:
            db = _get_appwrite()
            data = {"status": status}
            if status == "sent":
                data["sent_at"] = datetime.now(timezone.utc).isoformat()
            if status == "failed" and error_msg:
                data["error_message"] = str(error_msg)[:1000]
            db.update_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=RECIPIENTS_COLLECTION,
                document_id=doc_id,
                data=data,
            )
        except Exception as e:
            logger.error(f"Failed to update recipient {doc_id}: {e}")

    async def _update_campaign_status(self, job: CampaignJob, status: str):
        """Update campaign document status and counters."""
        try:
            db = _get_appwrite()
            data = {
                "status": status,
                "sent_count": job.sent,
                "failed_count": job.failed,
                "total_recipients": job.sent + job.failed,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            if status == "sent":
                data["sent_at"] = datetime.now(timezone.utc).isoformat()
            db.update_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=CAMPAIGNS_COLLECTION,
                document_id=job.campaign_id,
                data=data,
            )
        except Exception as e:
            logger.error(f"Failed to update campaign {job.campaign_id}: {e}")

    async def _update_analytics(self, job: CampaignJob):
        """Update campaign analytics document."""
        doc_id = job.request.analytics_doc_id
        if not doc_id:
            # Try to find by campaign_id
            try:
                db = _get_appwrite()
                result = db.list_documents(
                    database_id=settings.APPWRITE_DATABASE_ID,
                    collection_id=ANALYTICS_COLLECTION,
                    queries=[AppwriteQuery.equal("campaign_id", job.campaign_id)],
                )
                docs = result.get("documents", result.get("rows", []))
                if docs:
                    doc_id = docs[0]["$id"]
            except Exception as e:
                logger.error(f"Failed to find analytics for {job.campaign_id}: {e}")
                return

        if not doc_id:
            return

        try:
            db = _get_appwrite()
            db.update_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=ANALYTICS_COLLECTION,
                document_id=doc_id,
                data={
                    "sent_count": job.sent,
                    "bounced_count": job.failed,
                    "total_recipients": job.sent + job.failed,
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                },
            )
        except Exception as e:
            logger.error(f"Failed to update analytics for {job.campaign_id}: {e}")


# Singleton
queue_manager = QueueManager()
