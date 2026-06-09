"""
Reminder Service
================
Polls Appwrite for event reminders that are due and sends them
to all registered attendees.

Flow:
1. Query event-reminders where status=pending and remind_at <= now
2. For each due reminder:
   a. Mark as "processing"
   b. Fetch event details
   c. Fetch all registered attendees for that event
   d. Send reminder email to each attendee
   e. Update reminder status (sent/failed) with counts
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.tables_db import TablesDB
from appwrite.query import Query as AppwriteQuery

from src.config import settings

logger = logging.getLogger(__name__)

# Collection IDs
REMINDERS_COLLECTION = "event-reminders"
EVENTS_COLLECTION = "events-collection"
ATTENDEES_COLLECTION = "attendees-collection"


def _get_db() -> TablesDB:
    """Get Appwrite TablesDB instance."""
    client = Client()
    client.set_endpoint(settings.APPWRITE_ENDPOINT)
    client.set_project(settings.APPWRITE_PROJECT_ID)
    client.set_key(settings.APPWRITE_API_KEY)
    return TablesDB(client)


class ReminderService:
    """
    Polls Appwrite for due event reminders and sends emails to attendees.
    Runs alongside the campaign scheduler in the same async loop.
    """

    def __init__(self):
        self._running = False
        self._task = None
        self._poll_interval = settings.SCHEDULER_POLL_INTERVAL_SECONDS

    async def start(self):
        """Start the reminder polling loop."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())
        logger.info(f"Reminder service started (poll every {self._poll_interval}s)")

    async def stop(self):
        """Stop the reminder service."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Reminder service stopped")

    async def _poll_loop(self):
        """Main polling loop."""
        while self._running:
            try:
                await self._check_due_reminders()
            except Exception as e:
                logger.error(f"Reminder poll error: {e}", exc_info=True)
            await asyncio.sleep(self._poll_interval)

    async def _check_due_reminders(self):
        """Check for reminders that are due."""
        try:
            db = _get_db()
            now_iso = datetime.now(timezone.utc).isoformat()

            result = db.list_rows(
                database_id=settings.APPWRITE_DATABASE_ID,
                table_id=REMINDERS_COLLECTION,
                queries=[
                    AppwriteQuery.equal("status", "pending"),
                    AppwriteQuery.less_than_equal("remind_at", now_iso),
                    AppwriteQuery.limit(10),
                ],
            )

            docs = result.get("documents", result.get("rows", []))
            if not docs:
                return

            logger.info(f"Reminder service found {len(docs)} due reminders")

            for reminder_doc in docs:
                try:
                    await self._process_reminder(db, reminder_doc)
                except Exception as e:
                    logger.error(
                        f"Failed to process reminder {reminder_doc.get('$id')}: {e}",
                        exc_info=True,
                    )
                    # Mark as failed
                    try:
                        db.update_row(
                            database_id=settings.APPWRITE_DATABASE_ID,
                            table_id=REMINDERS_COLLECTION,
                            row_id=reminder_doc["$id"],
                            data={
                                "status": "failed",
                            },
                        )
                    except Exception:
                        pass

        except Exception as e:
            logger.error(f"Reminder query failed: {e}")

    async def _process_reminder(self, db: Databases, reminder_doc: dict):
        """Process a single reminder: fetch attendees and send emails."""
        from src.services.email_service import EmailService

        reminder_id = reminder_doc["$id"]
        event_id = reminder_doc["event_id"]

        logger.info(f"Processing reminder {reminder_id} for event {event_id}")

        # Mark as processing
        db.update_row(
            database_id=settings.APPWRITE_DATABASE_ID,
            table_id=REMINDERS_COLLECTION,
            row_id=reminder_id,
            data={"status": "processing"},
        )

        # Fetch event
        try:
            event = db.get_row(
                database_id=settings.APPWRITE_DATABASE_ID,
                table_id=EVENTS_COLLECTION,
                row_id=event_id,
            )
        except Exception as e:
            logger.error(f"Event {event_id} not found: {e}")
            db.update_row(
                database_id=settings.APPWRITE_DATABASE_ID,
                table_id=REMINDERS_COLLECTION,
                row_id=reminder_id,
                data={"status": "failed"},
            )
            return

        # Fetch attendees (approved only)
        attendees = await self._get_attendees(db, event_id)
        if not attendees:
            logger.info(f"No attendees for event {event_id}, marking reminder as sent")
            db.update_row(
                database_id=settings.APPWRITE_DATABASE_ID,
                table_id=REMINDERS_COLLECTION,
                row_id=reminder_id,
                data={
                    "status": "sent",
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                    "sent_count": 0,
                    "failed_count": 0,
                },
            )
            return

        # Prepare email content
        subject = reminder_doc.get("subject") or f"Reminder: {event.get('event_name', 'Event')}"
        custom_message = reminder_doc.get("message") or ""
        
        html_content = self._build_reminder_email(event, custom_message)

        # Send emails
        email_service = EmailService()
        sent_count = 0
        failed_count = 0

        try:
            for attendee in attendees:
                email = attendee.get("email")
                name = f"{attendee.get('first_name', '')} {attendee.get('last_name', '')}".strip()
                
                if not email:
                    continue

                try:
                    success = await email_service.send_email(
                        to_email=email,
                        to_name=name,
                        subject=subject,
                        html_content=html_content,
                        sender_name=f"Sinod - {event.get('event_name', 'Event Reminder')}",
                    )
                    if success:
                        sent_count += 1
                    else:
                        failed_count += 1
                except Exception as e:
                    logger.error(f"Failed to send reminder to {email}: {e}")
                    failed_count += 1

                # Rate limiting
                await asyncio.sleep(0.2)

        finally:
            email_service.close()

        # Update reminder status
        final_status = "sent" if sent_count > 0 else "failed"
        db.update_row(
            database_id=settings.APPWRITE_DATABASE_ID,
            table_id=REMINDERS_COLLECTION,
            row_id=reminder_id,
            data={
                "status": final_status,
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "sent_count": sent_count,
                "failed_count": failed_count,
            },
        )

        logger.info(
            f"Reminder {reminder_id} complete: {sent_count} sent, {failed_count} failed"
        )

    async def _get_attendees(self, db: Databases, event_id: str) -> List[dict]:
        """Fetch all approved attendees for an event."""
        all_attendees = []
        offset = 0
        limit = 100

        while True:
            result = db.list_rows(
                database_id=settings.APPWRITE_DATABASE_ID,
                table_id=ATTENDEES_COLLECTION,
                queries=[
                    AppwriteQuery.equal("event_id", event_id),
                    AppwriteQuery.equal("approved", True),
                    AppwriteQuery.limit(limit),
                    AppwriteQuery.offset(offset),
                ],
            )

            docs = result.get("documents", result.get("rows", []))
            all_attendees.extend(docs)

            if len(docs) < limit:
                break
            offset += limit

        return all_attendees

    def _build_reminder_email(self, event: dict, custom_message: str = "") -> str:
        """Build the reminder email HTML content."""
        event_name = event.get("event_name", "Event")
        event_time = event.get("event_time", "")
        event_address = event.get("event_address", "")
        event_url = event.get("event_url", "")
        is_virtual = event.get("virtual_status", False)

        # Format date/time
        try:
            dt = datetime.fromisoformat(event_time.replace("Z", "+00:00"))
            formatted_date = dt.strftime("%A, %B %d, %Y")
            formatted_time = dt.strftime("%I:%M %p %Z")
        except Exception:
            formatted_date = event_time
            formatted_time = ""

        location_html = ""
        if is_virtual and event_url:
            location_html = f'''
            <p style="margin: 0; color: #4a5568;">
                <strong>Join Online:</strong> <a href="{event_url}" style="color: #3182ce;">{event_url}</a>
            </p>
            '''
        elif event_address:
            location_html = f'''
            <p style="margin: 0; color: #4a5568;">
                <strong>Location:</strong> {event_address}
            </p>
            '''

        custom_section = ""
        if custom_message:
            custom_section = f'''
            <div style="background-color: #f7fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #2d3748;">{custom_message}</p>
            </div>
            '''

        frontend_url = settings.FRONTEND_URL
        event_page_url = event.get("event_page_url", "")
        event_link = f"{frontend_url}/event/{event_page_url}" if event_page_url else ""

        return f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                    ⏰ Event Reminder
                </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #2d3748; font-size: 22px;">
                    {event_name}
                </h2>
                
                <div style="border-left: 4px solid #667eea; padding-left: 16px; margin-bottom: 20px;">
                    <p style="margin: 0 0 8px 0; color: #4a5568;">
                        <strong>📅 Date:</strong> {formatted_date}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #4a5568;">
                        <strong>🕐 Time:</strong> {formatted_time}
                    </p>
                    {location_html}
                </div>
                
                {custom_section}
                
                <p style="color: #718096; font-size: 14px; margin-top: 20px;">
                    This is a friendly reminder that your event is coming up soon. We look forward to seeing you!
                </p>
                
                {"<a href='" + event_link + "' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px;'>View Event Details</a>" if event_link else ""}
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                    You're receiving this because you registered for this event.
                </p>
                <p style="margin: 8px 0 0 0; color: #a0aec0; font-size: 12px;">
                    © {datetime.now().year} Sinod. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
'''


# Singleton instance
reminder_service = ReminderService()
