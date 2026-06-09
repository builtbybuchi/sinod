"""
Scheduler service that polls Appwrite for scheduled campaigns
whose scheduled_at time has arrived, and enqueues them for sending.
"""

import asyncio
import logging
from datetime import datetime, timezone

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.tables_db import TablesDB
from appwrite.query import Query as AppwriteQuery
from appwrite.id import ID

from src.config import settings

logger = logging.getLogger(__name__)

# Collection IDs (same as main backend)
CAMPAIGNS_COLLECTION = "newsletter-campaigns"
SCHEDULED_COLLECTION = "scheduled-campaigns"
SUBSCRIBERS_COLLECTION = "user-mailing-list-subscribers"
RECIPIENTS_COLLECTION = "newsletter-recipients"
ANALYTICS_COLLECTION = "campaign-analytics"


def _get_db() -> TablesDB:
    client = Client()
    client.set_endpoint(settings.APPWRITE_ENDPOINT)
    client.set_project(settings.APPWRITE_PROJECT_ID)
    client.set_key(settings.APPWRITE_API_KEY)
    return TablesDB(client)


class SchedulerService:
    """
    Polls Appwrite for scheduled campaigns that are due and enqueues them.
    
    Flow:
    1. Query scheduled-campaigns where status=pending and scheduled_at <= now
    2. For each due campaign:
       a. Mark scheduled entry as "processing"
       b. Collect recipients from mailing lists
       c. Create recipient records in Appwrite
       d. Create analytics record
       e. Update campaign status to "sending"
       f. Enqueue the send job via QueueManager
       g. Mark scheduled entry as "completed"
    """

    def __init__(self):
        self._running = False
        self._task = None
        self._poll_interval = settings.SCHEDULER_POLL_INTERVAL_SECONDS

    async def start(self):
        """Start the scheduler polling loop."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())
        logger.info(f"Scheduler started (poll every {self._poll_interval}s)")

    async def stop(self):
        """Stop the scheduler."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Scheduler stopped")

    async def _poll_loop(self):
        """Main polling loop."""
        while self._running:
            try:
                await self._check_due_campaigns()
            except Exception as e:
                logger.error(f"Scheduler poll error: {e}", exc_info=True)
            await asyncio.sleep(self._poll_interval)

    async def _check_due_campaigns(self):
        """Check for scheduled campaigns that are due."""
        try:
            db = _get_db()
            now_iso = datetime.now(timezone.utc).isoformat()

            result = db.list_rows(
                database_id=settings.APPWRITE_DATABASE_ID,
                table_id=SCHEDULED_COLLECTION,
                queries=[
                    AppwriteQuery.equal("status", "pending"),
                    AppwriteQuery.less_than_equal("scheduled_at", now_iso),
                    AppwriteQuery.limit(10),
                ],
            )

            docs = result.get("documents", result.get("rows", []))
            if not docs:
                return

            logger.info(f"Scheduler found {len(docs)} due campaigns")

            for scheduled_doc in docs:
                try:
                    await self._process_scheduled(db, scheduled_doc)
                except Exception as e:
                    logger.error(
                        f"Failed to process scheduled campaign "
                        f"{scheduled_doc.get('campaign_id')}: {e}",
                        exc_info=True,
                    )
                    # Mark as failed
                    try:
                        db.update_row(
                            database_id=settings.APPWRITE_DATABASE_ID,
                            table_id=SCHEDULED_COLLECTION,
                            row_id=scheduled_doc["$id"],
                            data={
                                "status": "failed",
                                "error_message": str(e)[:500],
                            },
                        )
                    except Exception:
                        pass

        except Exception as e:
            logger.error(f"Scheduler query failed: {e}")

    async def _process_scheduled(self, db: Databases, scheduled_doc: dict):
        """Process a single scheduled campaign: collect recipients and enqueue."""
        import json
        from src.services.queue_manager import queue_manager
        from src.models import SendCampaignRequest, RecipientInfo

        campaign_id = scheduled_doc["campaign_id"]
        doc_id = scheduled_doc["$id"]

        logger.info(f"Processing scheduled campaign {campaign_id}")

        # Mark as processing
        db.update_row(
            database_id=settings.APPWRITE_DATABASE_ID,
            table_id=SCHEDULED_COLLECTION,
            row_id=doc_id,
            data={"status": "processing"},
        )

        # Fetch the campaign
        campaign = db.get_row(
            database_id=settings.APPWRITE_DATABASE_ID,
            table_id=CAMPAIGNS_COLLECTION,
            row_id=campaign_id,
        )

        # Collect recipients from mailing lists
        list_ids = []
        try:
            list_ids = json.loads(campaign.get("recipient_list_ids", "[]"))
        except Exception:
            pass

        if not list_ids:
            raise ValueError("No mailing lists on campaign")

        all_recipients = {}  # email -> name
        for list_id in list_ids:
            subs = db.list_rows(
                database_id=settings.APPWRITE_DATABASE_ID,
                table_id=SUBSCRIBERS_COLLECTION,
                queries=[
                    AppwriteQuery.equal("list_id", list_id),
                    AppwriteQuery.equal("subscribed", True),
                    AppwriteQuery.limit(1000),
                ],
            )
            for sub in subs.get("documents", subs.get("rows", [])):
                email = sub.get("email", "").lower()
                if email and email not in all_recipients:
                    all_recipients[email] = sub.get("name", "")

        if not all_recipients:
            raise ValueError("No subscribers found")

        total = len(all_recipients)

        # Update campaign status to "sending"
        db.update_row(
            database_id=settings.APPWRITE_DATABASE_ID,
            table_id=CAMPAIGNS_COLLECTION,
            row_id=campaign_id,
            data={
                "status": "sending",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        # Create recipient records and collect doc IDs
        recipient_infos = []
        for email, name in all_recipients.items():
            rdoc = db.create_row(
                database_id=settings.APPWRITE_DATABASE_ID,
                table_id=RECIPIENTS_COLLECTION,
                row_id=ID.unique(),
                data={
                    "campaign_id": campaign_id,
                    "email": email,
                    "name": name,
                    "status": "pending",
                },
            )
            recipient_infos.append(
                RecipientInfo(
                    email=email,
                    name=name,
                    recipient_doc_id=rdoc["$id"],
                )
            )

        # Create analytics record
        analytics_doc = db.create_row(
            database_id=settings.APPWRITE_DATABASE_ID,
            table_id=ANALYTICS_COLLECTION,
            row_id=ID.unique(),
            data={
                "campaign_id": campaign_id,
                "total_recipients": total,
                "sent_count": 0,
                "delivered_count": 0,
                "opened_count": 0,
                "unique_opens": 0,
                "clicked_count": 0,
                "unique_clicks": 0,
                "bounced_count": 0,
                "unsubscribed_count": 0,
                "open_rate": 0,
                "click_rate": 0,
                "bounce_rate": 0,
                "last_updated": datetime.now(timezone.utc).isoformat(),
            },
        )

        # Enqueue send job
        req = SendCampaignRequest(
            campaign_id=campaign_id,
            subject=campaign["subject"],
            content_html=campaign["content_html"],
            sender_name=campaign["sender_name"],
            owner_email=campaign.get("owner_email", ""),
            list_id=list_ids[0] if list_ids else "",
            sender_logo_url=campaign.get("sender_logo_url", "") or "",
            reply_to_email=campaign.get("reply_to_email", "") or "",
            recipients=recipient_infos,
            analytics_doc_id=analytics_doc["$id"],
        )
        queue_manager.enqueue(req)

        # Mark scheduled entry as completed
        db.update_row(
            database_id=settings.APPWRITE_DATABASE_ID,
            table_id=SCHEDULED_COLLECTION,
            row_id=doc_id,
            data={
                "status": "completed",
                "processed_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        logger.info(f"Scheduled campaign {campaign_id} enqueued ({total} recipients)")


# Singleton
scheduler = SchedulerService()
