"""
Event Reminders API Routes
==========================
CRUD operations for event reminders.
The actual sending is done by the Newsletter microservice.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query as QueryParam
from appwrite.query import Query
from appwrite.id import ID

from models.reminder_models import (
    ReminderCreate,
    ReminderUpdate,
    ReminderBulkCreate,
    ReminderResponse,
    ReminderListResponse,
    ReminderPresetOption,
    ReminderPresetsResponse,
    ReminderOffsetType,
    ReminderStatus,
    REMINDER_PRESETS,
)
from services.appwrite_service import get_appwrite_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reminders", tags=["Reminders"])

# Collection IDs
REMINDERS_COLLECTION = "event-reminders"
EVENTS_COLLECTION = settings.APPWRITE_EVENTS_COLLECTION_ID


# ==================== HELPER FUNCTIONS ====================

def _calculate_remind_at(event_time: str, offset_minutes: int) -> str:
    """Calculate the reminder datetime based on event start and offset."""
    event_dt = datetime.fromisoformat(event_time.replace("Z", "+00:00"))
    remind_dt = event_dt - timedelta(minutes=offset_minutes)
    return remind_dt.isoformat()


def _get_event(appwrite, event_id: str) -> dict:
    """Fetch event by ID, raise 404 if not found."""
    try:
        return appwrite.get_document(EVENTS_COLLECTION, event_id)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")


def _verify_organizer(event: dict, user_email: str):
    """Verify the user is the event organizer."""
    if event.get("user_email") != user_email:
        raise HTTPException(status_code=403, detail="Only the event organizer can manage reminders")


# ==================== ENDPOINTS ====================

@router.get("/presets", response_model=ReminderPresetsResponse)
async def get_reminder_presets():
    """Get available reminder preset options."""
    presets = [
        ReminderPresetOption(key="15_minutes", label="15 minutes before", minutes=15),
        ReminderPresetOption(key="30_minutes", label="30 minutes before", minutes=30),
        ReminderPresetOption(key="1_hour", label="1 hour before", minutes=60),
        ReminderPresetOption(key="2_hours", label="2 hours before", minutes=120),
        ReminderPresetOption(key="1_day", label="1 day before", minutes=1440),
        ReminderPresetOption(key="2_days", label="2 days before", minutes=2880),
        ReminderPresetOption(key="1_week", label="1 week before", minutes=10080),
    ]
    return ReminderPresetsResponse(presets=presets)


@router.post("", response_model=ReminderResponse)
async def create_reminder(reminder: ReminderCreate):
    """
    Create a single event reminder.
    The remind_at time is calculated based on event start time and offset.
    """
    try:
        appwrite = get_appwrite_service()
        
        # Verify event exists and user is organizer
        event = _get_event(appwrite, reminder.event_id)
        _verify_organizer(event, reminder.created_by)
        
        # Calculate remind_at
        if reminder.offset_type == ReminderOffsetType.BEFORE_START:
            remind_at = _calculate_remind_at(event["event_time"], reminder.offset_minutes)
        else:
            if not reminder.remind_at:
                raise HTTPException(status_code=400, detail="remind_at required for custom offset type")
            remind_at = reminder.remind_at.isoformat()
        
        # Check if reminder is in the past
        remind_dt = datetime.fromisoformat(remind_at.replace("Z", "+00:00"))
        if remind_dt <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Reminder time is in the past")
        
        data = {
            "event_id": reminder.event_id,
            "offset_type": reminder.offset_type.value,
            "offset_minutes": reminder.offset_minutes,
            "remind_at": remind_at,
            "subject": reminder.subject or f"Reminder: {event['event_name']}",
            "message": reminder.message or "",
            "status": ReminderStatus.PENDING.value,
            "sent_count": 0,
            "failed_count": 0,
            "created_by": reminder.created_by,
        }
        
        result = appwrite.create_document(
            collection_id=REMINDERS_COLLECTION,
            document_id=ID.unique(),
            data=data,
        )
        
        logger.info(f"Created reminder {result['$id']} for event {reminder.event_id}")
        return ReminderResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk", response_model=ReminderListResponse)
async def create_reminders_bulk(request: ReminderBulkCreate):
    """
    Create multiple reminders at once using presets.
    Convenient for setting up standard reminders during event creation.
    """
    try:
        appwrite = get_appwrite_service()
        
        # Verify event exists and user is organizer
        event = _get_event(appwrite, request.event_id)
        _verify_organizer(event, request.created_by)
        
        created = []
        for preset_key in request.presets:
            if preset_key not in REMINDER_PRESETS:
                continue  # Skip invalid presets
            
            offset_minutes = REMINDER_PRESETS[preset_key]
            remind_at = _calculate_remind_at(event["event_time"], offset_minutes)
            
            # Skip if in the past
            remind_dt = datetime.fromisoformat(remind_at.replace("Z", "+00:00"))
            if remind_dt <= datetime.now(timezone.utc):
                continue
            
            data = {
                "event_id": request.event_id,
                "offset_type": ReminderOffsetType.BEFORE_START.value,
                "offset_minutes": offset_minutes,
                "remind_at": remind_at,
                "subject": request.custom_subject or f"Reminder: {event['event_name']}",
                "message": request.custom_message or "",
                "status": ReminderStatus.PENDING.value,
                "sent_count": 0,
                "failed_count": 0,
                "created_by": request.created_by,
            }
            
            result = appwrite.create_document(
                collection_id=REMINDERS_COLLECTION,
                document_id=ID.unique(),
                data=data,
            )
            created.append(ReminderResponse(**result))
        
        logger.info(f"Created {len(created)} reminders for event {request.event_id}")
        return ReminderListResponse(reminders=created, total=len(created))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating bulk reminders: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/event/{event_id}", response_model=ReminderListResponse)
async def list_event_reminders(
    event_id: str,
    status: Optional[str] = QueryParam(None, description="Filter by status"),
):
    """List all reminders for an event."""
    try:
        appwrite = get_appwrite_service()
        
        queries = [
            Query.equal("event_id", event_id),
            Query.order_asc("remind_at"),
            Query.limit(100),
        ]
        
        if status:
            queries.append(Query.equal("status", status))
        
        result = appwrite.list_documents(
            collection_id=REMINDERS_COLLECTION,
            queries=queries,
        )
        
        docs = result.get("documents", [])
        return ReminderListResponse(
            reminders=[ReminderResponse(**d) for d in docs],
            total=len(docs),
        )
        
    except Exception as e:
        logger.error(f"Error listing reminders: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(reminder_id: str):
    """Get a specific reminder by ID."""
    try:
        appwrite = get_appwrite_service()
        result = appwrite.get_document(REMINDERS_COLLECTION, reminder_id)
        return ReminderResponse(**result)
    except Exception:
        raise HTTPException(status_code=404, detail="Reminder not found")


@router.patch("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: str,
    update: ReminderUpdate,
    user_email: str = QueryParam(..., description="Email of the user making the update"),
):
    """Update a reminder. Only pending reminders can be updated."""
    try:
        appwrite = get_appwrite_service()
        
        # Get existing reminder
        reminder = appwrite.get_document(REMINDERS_COLLECTION, reminder_id)
        
        # Verify organizer
        event = _get_event(appwrite, reminder["event_id"])
        _verify_organizer(event, user_email)
        
        # Can only update pending reminders
        if reminder.get("status") != ReminderStatus.PENDING.value:
            raise HTTPException(status_code=400, detail="Can only update pending reminders")
        
        # Build update data
        data = {}
        if update.offset_type is not None:
            data["offset_type"] = update.offset_type.value
        if update.offset_minutes is not None:
            data["offset_minutes"] = update.offset_minutes
        if update.subject is not None:
            data["subject"] = update.subject
        if update.message is not None:
            data["message"] = update.message
        if update.status is not None:
            data["status"] = update.status.value
        
        # Recalculate remind_at if offset changed
        if update.offset_minutes or update.offset_type:
            offset_type = update.offset_type.value if update.offset_type else reminder["offset_type"]
            offset_minutes = update.offset_minutes or reminder["offset_minutes"]
            
            if offset_type == ReminderOffsetType.BEFORE_START.value:
                data["remind_at"] = _calculate_remind_at(event["event_time"], offset_minutes)
            elif update.remind_at:
                data["remind_at"] = update.remind_at.isoformat()
        
        if not data:
            return ReminderResponse(**reminder)
        
        result = appwrite.update_document(REMINDERS_COLLECTION, reminder_id, data)
        return ReminderResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: str,
    user_email: str = QueryParam(..., description="Email of the user deleting"),
):
    """Delete a reminder. Only pending reminders can be deleted."""
    try:
        appwrite = get_appwrite_service()
        
        # Get existing reminder
        reminder = appwrite.get_document(REMINDERS_COLLECTION, reminder_id)
        
        # Verify organizer
        event = _get_event(appwrite, reminder["event_id"])
        _verify_organizer(event, user_email)
        
        # Can only delete pending or cancelled reminders
        if reminder.get("status") not in [ReminderStatus.PENDING.value, ReminderStatus.CANCELLED.value]:
            raise HTTPException(status_code=400, detail="Cannot delete a reminder that is processing or sent")
        
        appwrite.delete_document(REMINDERS_COLLECTION, reminder_id)
        
        return {"message": "Reminder deleted", "id": reminder_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{reminder_id}/cancel", response_model=ReminderResponse)
async def cancel_reminder(
    reminder_id: str,
    user_email: str = QueryParam(..., description="Email of the organizer"),
):
    """Cancel a pending reminder."""
    try:
        appwrite = get_appwrite_service()
        
        reminder = appwrite.get_document(REMINDERS_COLLECTION, reminder_id)
        
        event = _get_event(appwrite, reminder["event_id"])
        _verify_organizer(event, user_email)
        
        if reminder.get("status") != ReminderStatus.PENDING.value:
            raise HTTPException(status_code=400, detail="Can only cancel pending reminders")
        
        result = appwrite.update_document(
            REMINDERS_COLLECTION,
            reminder_id,
            {"status": ReminderStatus.CANCELLED.value},
        )
        
        return ReminderResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))
