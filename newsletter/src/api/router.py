"""
API endpoints for the newsletter microservice.
All endpoints (except /health) require the X-Service-Secret header
matching the SERVICE_SECRET env var.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Header

from src.config import settings
from src.models import (
    SendCampaignRequest,
    CancelJobRequest,
    JobResponse,
    JobStatusResponse,
    HealthResponse,
    JobStatus,
)
from src.services.queue_manager import queue_manager

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Auth dependency
# ------------------------------------------------------------------

def _verify_secret(x_service_secret: Optional[str] = Header(None)):
    """Verify that the caller knows the shared secret."""
    if not x_service_secret or x_service_secret != settings.SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ------------------------------------------------------------------
# Routers
# ------------------------------------------------------------------

health_router = APIRouter(tags=["Health"])
campaign_router = APIRouter(prefix="/api/newsletter", tags=["Newsletter"])


# ==================== HEALTH ====================

@health_router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        environment=settings.ENVIRONMENT,
        queue_size=queue_manager.queue_size,
        active_jobs=queue_manager.active_count,
        smtp_configured=bool(settings.SMTP_HOST and settings.SMTP_PASSWORD),
    )


@health_router.get("/")
async def root():
    return {
        "service": "Sinod Newsletter Microservice",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


# ==================== SEND ====================

@campaign_router.post("/send", response_model=JobResponse)
async def enqueue_campaign(
    request: SendCampaignRequest,
    x_service_secret: Optional[str] = Header(None),
):
    """
    Enqueue a campaign for immediate sending.
    Called by the main backend after it has prepared recipients.
    """
    _verify_secret(x_service_secret)

    # Reject if already being processed
    existing = queue_manager.get_job_by_campaign(request.campaign_id)
    if existing and existing.status in (JobStatus.QUEUED, JobStatus.PROCESSING):
        raise HTTPException(
            status_code=409,
            detail=f"Campaign {request.campaign_id} is already {existing.status.value}",
        )

    if not request.recipients:
        raise HTTPException(status_code=400, detail="No recipients provided")

    job = queue_manager.enqueue(request)
    return JobResponse(
        job_id=job.job_id,
        campaign_id=job.campaign_id,
        status=job.status,
        total_recipients=job.total,
        message=f"Queued {job.total} recipients for sending",
    )


# ==================== STATUS ====================

@campaign_router.get("/status/{campaign_id}", response_model=JobStatusResponse)
async def get_campaign_status(
    campaign_id: str,
    x_service_secret: Optional[str] = Header(None),
):
    """Get the current status of a campaign send job."""
    _verify_secret(x_service_secret)

    job = queue_manager.get_job_by_campaign(campaign_id)
    if not job:
        raise HTTPException(status_code=404, detail="No job found for this campaign")
    return job.to_status_response()


@campaign_router.get("/job/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    x_service_secret: Optional[str] = Header(None),
):
    """Get job status by job ID."""
    _verify_secret(x_service_secret)

    job = queue_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_status_response()


# ==================== CANCEL ====================

@campaign_router.post("/cancel", response_model=JobResponse)
async def cancel_campaign(
    request: CancelJobRequest,
    x_service_secret: Optional[str] = Header(None),
):
    """Cancel a queued campaign (cannot cancel if already processing)."""
    _verify_secret(x_service_secret)

    job = queue_manager.get_job_by_campaign(request.campaign_id)
    if not job:
        raise HTTPException(status_code=404, detail="No job found for this campaign")

    if queue_manager.cancel_job(request.campaign_id):
        return JobResponse(
            job_id=job.job_id,
            campaign_id=job.campaign_id,
            status=JobStatus.CANCELLED,
            total_recipients=job.total,
            message="Campaign cancelled",
        )
    else:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot cancel: job is {job.status.value}",
        )


# ==================== QUEUE INFO ====================

@campaign_router.get("/queue")
async def queue_info(x_service_secret: Optional[str] = Header(None)):
    """Get queue overview."""
    _verify_secret(x_service_secret)

    jobs = list(queue_manager._jobs.values())
    return {
        "queue_size": queue_manager.queue_size,
        "active_jobs": queue_manager.active_count,
        "total_tracked": len(jobs),
        "jobs": [
            {
                "job_id": j.job_id,
                "campaign_id": j.campaign_id,
                "status": j.status.value,
                "total": j.total,
                "sent": j.sent,
                "failed": j.failed,
                "progress": j.progress,
            }
            for j in sorted(jobs, key=lambda x: x.queued_at, reverse=True)[:20]
        ],
    }
