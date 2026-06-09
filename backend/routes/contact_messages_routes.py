"""
Contact Messages API routes - captures contact form submissions and event delete reasons
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from services.appwrite_service import get_appwrite_service

logger = logging.getLogger(__name__)

router = APIRouter()

CONTACT_MESSAGES_COLLECTION = "contact-messages"


class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    type: Optional[str] = "contact"  # contact | delete_reason | other
    event_id: Optional[str] = None
    reason: Optional[str] = None


@router.post("/contact-messages")
async def create_contact_message(payload: ContactMessage):
    """Create a contact message entry in Appwrite."""
    try:
        appwrite = get_appwrite_service()

        doc = appwrite.create_document(
            collection_id=CONTACT_MESSAGES_COLLECTION,
            data={
                "name": payload.name,
                "email": payload.email,
                "subject": payload.subject,
                "message": payload.message,
                "type": payload.type or "contact",
                "event_id": payload.event_id or "",
                "reason": payload.reason or "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        return {"success": True, "id": doc.get("$id")}
    except Exception as e:
        logger.error(f"Failed to create contact message: {e}")
        raise HTTPException(status_code=500, detail="Failed to save message")
