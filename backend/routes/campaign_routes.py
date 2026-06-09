"""
Campaign routes for Newsletter/Email Campaign system.
Handles mailing lists, subscribers, campaigns, templates, tracking, and analytics.
Email sending is delegated to the newsletter microservice.
"""

import json
import csv
import io
import base64
import hashlib
import logging
import asyncio
import httpx
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Request, Response, BackgroundTasks
from fastapi.responses import RedirectResponse
from appwrite.query import Query as AppwriteQuery
from appwrite.id import ID

from config import settings
from services.appwrite_service import AppwriteService
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)

from models.campaign_models import (
    # Mailing Lists
    MailingListCreate, MailingListUpdate, MailingListResponse,
    # Subscribers
    SubscriberCreate, SubscriberBulkCreate, SubscriberUpdate, SubscriberResponse,
    SubscriberSource, CSVImportRequest, CSVImportResponse,
    # Campaigns
    CampaignCreate, CampaignUpdate, CampaignResponse, CampaignStatus,
    SendCampaignRequest, SendCampaignResponse,
    # Recipients
    CampaignRecipientResponse, RecipientStatus,
    # Events & Tracking
    EmailEventCreate, EmailEventResponse, EmailEventType,
    # Templates
    TemplateCreate, TemplateUpdate, TemplateResponse,
    # Analytics
    CampaignAnalyticsResponse,
    # Unsubscribe
    UnsubscribeRequest, UnsubscribeResponse, CampaignUnsubscribeResponse,
    # Audience
    AudienceSelection, AudiencePreviewResponse, EventAudienceFilter,
    # Spam Warning
    SpamWarningAcknowledgement
)

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

# Collection IDs - must match appwrite_setup.py
MAILING_LISTS_COLLECTION = "user-mailing-lists"
SUBSCRIBERS_COLLECTION = "user-mailing-list-subscribers"
CAMPAIGNS_COLLECTION = "newsletter-campaigns"
RECIPIENTS_COLLECTION = "newsletter-recipients"
EVENTS_COLLECTION = "newsletter-link-clicks"
TEMPLATES_COLLECTION = "campaign-templates"
SCHEDULED_COLLECTION = "scheduled-campaigns"
UNSUBSCRIBES_COLLECTION = "newsletter-unsubscribe-log"
ANALYTICS_COLLECTION = "campaign-analytics"
EVENTS_ATTENDEES_COLLECTION = settings.APPWRITE_ATTENDEES_COLLECTION_ID


# ==================== HELPER FUNCTIONS ====================

def _parse_json_list(value: str) -> List[str]:
    """Parse a JSON string to a list, returning empty list on failure"""
    if not value:
        return []
    try:
        return json.loads(value)
    except:
        return []


def _parse_datetime(value: str) -> Optional[datetime]:
    """Parse an ISO datetime string, returning None on failure"""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except:
        return None


def _parse_campaign_response(doc: dict) -> CampaignResponse:
    """Parse an Appwrite document into a CampaignResponse"""
    return CampaignResponse(
        id=doc["$id"],
        owner_email=doc["owner_email"],
        title=doc["title"],
        subject=doc["subject"],
        sender_name=doc["sender_name"],
        sender_logo_url=doc.get("sender_logo_url", "") or None,
        reply_to_email=doc.get("reply_to_email", "") or None,
        content_html=doc["content_html"],
        content_json=doc.get("content_json", ""),
        status=CampaignStatus(doc.get("status", "draft")),
        recipient_list_ids=_parse_json_list(doc.get("recipient_list_ids", "")),
        recipient_event_ids=_parse_json_list(doc.get("recipient_event_ids", "")),
        recipient_filter=doc.get("recipient_filter", "all"),
        total_recipients=doc.get("total_recipients", 0),
        sent_count=doc.get("sent_count", 0),
        failed_count=doc.get("failed_count", 0),
        open_count=doc.get("open_count", 0),
        click_count=doc.get("click_count", 0),
        unsubscribe_count=doc.get("unsubscribe_count", 0),
        bounce_count=doc.get("bounce_count", 0),
        scheduled_at=_parse_datetime(doc.get("scheduled_at")),
        sent_at=_parse_datetime(doc.get("sent_at")),
        created_at=_parse_datetime(doc["created_at"]),
        updated_at=_parse_datetime(doc["updated_at"])
    )


# ==================== MAILING LISTS ====================

@router.get("/mailing-lists", response_model=List[MailingListResponse])
async def get_mailing_lists(
    owner_email: str = Query(..., description="Owner's email address")
):
    """Get all mailing lists for a user"""
    try:
        appwrite = AppwriteService()
        result = appwrite.list_documents(
            MAILING_LISTS_COLLECTION,
            queries=[
                AppwriteQuery.equal("owner_email", owner_email),
                AppwriteQuery.order_desc("created_at"),
                AppwriteQuery.limit(100)
            ]
        )
        
        lists = []
        for doc in result.get("documents", []):
            lists.append(MailingListResponse(
                id=doc["$id"],
                owner_email=doc["owner_email"],
                name=doc["name"],
                description=doc.get("description", ""),
                subscriber_count=doc.get("subscriber_count", 0),
                created_at=datetime.fromisoformat(doc["created_at"].replace("Z", "+00:00")),
                updated_at=datetime.fromisoformat(doc["updated_at"].replace("Z", "+00:00"))
            ))
        
        return lists
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mailing-lists", response_model=MailingListResponse)
async def create_mailing_list(
    data: MailingListCreate,
    owner_email: str = Query(..., description="Owner's email address")
):
    """Create a new mailing list"""
    try:
        appwrite = AppwriteService()
        now = datetime.now(timezone.utc).isoformat()
        
        doc_data = {
            "owner_email": owner_email,
            "name": data.name,
            "description": data.description or "",
            "subscriber_count": 0,
            "created_at": now,
            "updated_at": now
        }
        
        result = appwrite.create_document(
            MAILING_LISTS_COLLECTION,
            data=doc_data
        )
        
        return MailingListResponse(
            id=result["$id"],
            owner_email=result["owner_email"],
            name=result["name"],
            description=result.get("description", ""),
            subscriber_count=result.get("subscriber_count", 0),
            created_at=datetime.fromisoformat(result["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(result["updated_at"].replace("Z", "+00:00"))
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mailing-lists/{list_id}", response_model=MailingListResponse)
async def get_mailing_list(list_id: str):
    """Get a single mailing list"""
    try:
        appwrite = AppwriteService()
        doc = appwrite.get_document(
            MAILING_LISTS_COLLECTION,
            list_id
        )
        
        return MailingListResponse(
            id=doc["$id"],
            owner_email=doc["owner_email"],
            name=doc["name"],
            description=doc.get("description", ""),
            subscriber_count=doc.get("subscriber_count", 0),
            created_at=datetime.fromisoformat(doc["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(doc["updated_at"].replace("Z", "+00:00"))
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Mailing list not found")


@router.patch("/mailing-lists/{list_id}", response_model=MailingListResponse)
async def update_mailing_list(list_id: str, data: MailingListUpdate):
    """Update a mailing list"""
    try:
        appwrite = AppwriteService()
        
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        if data.name is not None:
            update_data["name"] = data.name
        if data.description is not None:
            update_data["description"] = data.description
        
        result = appwrite.update_document(
            MAILING_LISTS_COLLECTION,
            list_id,
            data=update_data
        )
        
        return MailingListResponse(
            id=result["$id"],
            owner_email=result["owner_email"],
            name=result["name"],
            description=result.get("description", ""),
            subscriber_count=result.get("subscriber_count", 0),
            created_at=datetime.fromisoformat(result["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(result["updated_at"].replace("Z", "+00:00"))
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/mailing-lists/{list_id}")
async def delete_mailing_list(list_id: str):
    """Delete a mailing list and all its subscribers"""
    try:
        appwrite = AppwriteService()
        
        # Delete all subscribers in this list
        subscribers = appwrite.list_documents(
            SUBSCRIBERS_COLLECTION,
            queries=[
                AppwriteQuery.equal("list_id", list_id),
                AppwriteQuery.limit(1000)
            ]
        )
        
        for sub in subscribers.get("documents", []):
            appwrite.delete_document(
                SUBSCRIBERS_COLLECTION,
                sub["$id"]
            )
        
        # Delete the list itself
        appwrite.delete_document(
            MAILING_LISTS_COLLECTION,
            list_id
        )
        
        return {"success": True, "message": "Mailing list deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SUBSCRIBERS ====================

@router.get("/mailing-lists/{list_id}/subscribers", response_model=List[SubscriberResponse])
async def get_list_subscribers(
    list_id: str,
    subscribed_only: bool = Query(True, description="Only return subscribed users"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Get subscribers for a mailing list"""
    try:
        appwrite = AppwriteService()
        
        queries = [
            AppwriteQuery.equal("list_id", list_id),
            AppwriteQuery.order_desc("subscribed_at"),
            AppwriteQuery.limit(limit),
            AppwriteQuery.offset(offset)
        ]
        
        if subscribed_only:
            queries.append(AppwriteQuery.equal("subscribed", True))
        
        result = appwrite.list_documents(
            SUBSCRIBERS_COLLECTION,
            queries=queries
        )
        
        subscribers = []
        for doc in result.get("documents", []):
            subscribers.append(SubscriberResponse(
                id=doc["$id"],
                list_id=doc["list_id"],
                email=doc["email"],
                name=doc.get("name", ""),
                subscribed=doc.get("subscribed", True),
                source=SubscriberSource(doc.get("source", "manual")),
                event_id=doc.get("event_id"),
                subscribed_at=datetime.fromisoformat(doc["subscribed_at"].replace("Z", "+00:00")),
                unsubscribed_at=datetime.fromisoformat(doc["unsubscribed_at"].replace("Z", "+00:00")) if doc.get("unsubscribed_at") else None,
                unsubscribe_reason=doc.get("unsubscribe_reason")
            ))
        
        return subscribers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mailing-lists/{list_id}/subscribers", response_model=SubscriberResponse)
async def add_subscriber(list_id: str, data: SubscriberCreate):
    """Add a single subscriber to a mailing list"""
    try:
        appwrite = AppwriteService()
        
        # Check if subscriber already exists in this list
        existing = appwrite.list_documents(
            SUBSCRIBERS_COLLECTION,
            queries=[
                AppwriteQuery.equal("list_id", list_id),
                AppwriteQuery.equal("email", data.email)
            ]
        )
        
        if existing.get("total", 0) > 0:
            raise HTTPException(status_code=409, detail="Subscriber already exists in this list")
        
        now = datetime.now(timezone.utc).isoformat()
        doc_data = {
            "list_id": list_id,
            "email": data.email,
            "name": data.name or "",
            "subscribed": data.subscribed,
            "source": data.source.value,
            "subscribed_at": now
        }
        
        if data.event_id:
            doc_data["event_id"] = data.event_id
        
        result = appwrite.create_document(
            SUBSCRIBERS_COLLECTION,
            document_id=ID.unique(),
            data=doc_data
        )
        
        # Update subscriber count
        await _update_list_subscriber_count(appwrite, list_id)
        
        return SubscriberResponse(
            id=result["$id"],
            list_id=result["list_id"],
            email=result["email"],
            name=result.get("name", ""),
            subscribed=result.get("subscribed", True),
            source=SubscriberSource(result.get("source", "manual")),
            event_id=result.get("event_id"),
            subscribed_at=datetime.fromisoformat(result["subscribed_at"].replace("Z", "+00:00")),
            unsubscribed_at=None,
            unsubscribe_reason=None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mailing-lists/{list_id}/subscribers/bulk")
async def add_subscribers_bulk(list_id: str, data: SubscriberBulkCreate):
    """Add multiple subscribers to a mailing list"""
    try:
        appwrite = AppwriteService()
        
        added = 0
        duplicates = 0
        errors = []
        
        for sub in data.subscribers:
            try:
                # Check if exists
                existing = appwrite.list_documents(
                    SUBSCRIBERS_COLLECTION,
                    queries=[
                        AppwriteQuery.equal("list_id", list_id),
                        AppwriteQuery.equal("email", sub.email)
                    ]
                )
                
                if existing.get("total", 0) > 0:
                    duplicates += 1
                    continue
                
                now = datetime.now(timezone.utc).isoformat()
                doc_data = {
                    "list_id": list_id,
                    "email": sub.email,
                    "name": sub.name or "",
                    "subscribed": sub.subscribed,
                    "source": sub.source.value,
                    "subscribed_at": now
                }
                
                if sub.event_id:
                    doc_data["event_id"] = sub.event_id
                
                appwrite.create_document(
                    SUBSCRIBERS_COLLECTION,
                    document_id=ID.unique(),
                    data=doc_data
                )
                added += 1
            except Exception as e:
                errors.append(f"Failed to add {sub.email}: {str(e)}")
        
        # Update subscriber count
        await _update_list_subscriber_count(appwrite, list_id)
        
        return {
            "success": True,
            "added": added,
            "duplicates": duplicates,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mailing-lists/{list_id}/import-csv", response_model=CSVImportResponse)
async def import_csv_subscribers(list_id: str, data: CSVImportRequest):
    """
    Import subscribers from CSV.
    Expected columns: name, email, subscribed (optional, defaults to true)
    Headers are case-insensitive.
    """
    try:
        appwrite = AppwriteService()
        
        # Decode base64 CSV content
        try:
            csv_content = base64.b64decode(data.csv_content).decode('utf-8')
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid CSV content encoding")
        
        # Parse CSV
        reader = csv.DictReader(io.StringIO(csv_content))
        
        # Normalize headers to lowercase
        if reader.fieldnames:
            normalized_fields = {f.lower().strip(): f for f in reader.fieldnames}
        else:
            raise HTTPException(status_code=400, detail="CSV file has no headers")
        
        # Check required columns
        if 'email' not in normalized_fields:
            raise HTTPException(status_code=400, detail="CSV must have an 'email' column")
        
        total_rows = 0
        imported = 0
        duplicates = 0
        invalid = 0
        errors = []
        
        for row in reader:
            total_rows += 1
            
            # Get email (required)
            email_field = normalized_fields.get('email')
            email = row.get(email_field, '').strip().lower() if email_field else ''
            
            if not email or '@' not in email:
                invalid += 1
                errors.append(f"Row {total_rows}: Invalid email")
                continue
            
            # Get name (optional)
            name_field = normalized_fields.get('name')
            name = row.get(name_field, '').strip() if name_field else ''
            
            # Get subscribed (optional, defaults to True)
            subscribed_field = normalized_fields.get('subscribed')
            subscribed_value = row.get(subscribed_field, 'true').strip().lower() if subscribed_field else 'true'
            subscribed = subscribed_value in ('true', 'yes', '1', 'y')
            
            try:
                # Check if exists
                existing = appwrite.list_documents(
                    SUBSCRIBERS_COLLECTION,
                    queries=[
                        AppwriteQuery.equal("list_id", list_id),
                        AppwriteQuery.equal("email", email)
                    ]
                )
                
                if existing.get("total", 0) > 0:
                    duplicates += 1
                    continue
                
                now = datetime.now(timezone.utc).isoformat()
                doc_data = {
                    "list_id": list_id,
                    "email": email,
                    "name": name,
                    "subscribed": subscribed,
                    "source": "csv",
                    "subscribed_at": now
                }
                
                appwrite.create_document(
                    SUBSCRIBERS_COLLECTION,
                    document_id=ID.unique(),
                    data=doc_data
                )
                imported += 1
            except Exception as e:
                errors.append(f"Row {total_rows}: {str(e)}")
        
        # Update subscriber count
        await _update_list_subscriber_count(appwrite, list_id)
        
        return CSVImportResponse(
            total_rows=total_rows,
            imported=imported,
            duplicates=duplicates,
            invalid=invalid,
            errors=errors[:10]  # Limit errors returned
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/mailing-lists/{list_id}/subscribers/{subscriber_id}")
async def remove_subscriber(list_id: str, subscriber_id: str):
    """Remove a subscriber from a mailing list"""
    try:
        appwrite = AppwriteService()
        
        appwrite.delete_document(
            SUBSCRIBERS_COLLECTION,
            subscriber_id
        )
        
        # Update subscriber count
        await _update_list_subscriber_count(appwrite, list_id)
        
        return {"success": True, "message": "Subscriber removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _update_list_subscriber_count(appwrite: AppwriteService, list_id: str):
    """Update the subscriber count for a mailing list"""
    try:
        result = appwrite.list_documents(
            SUBSCRIBERS_COLLECTION,
            queries=[
                AppwriteQuery.equal("list_id", list_id),
                AppwriteQuery.equal("subscribed", True),
                AppwriteQuery.limit(1)
            ]
        )
        
        count = result.get("total", 0)
        
        appwrite.update_document(
            MAILING_LISTS_COLLECTION,
            list_id,
            data={
                "subscriber_count": count,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        )
    except Exception as e:
        print(f"Failed to update subscriber count: {e}")


# ==================== IMPORT FROM EVENTS ====================

@router.post("/mailing-lists/{list_id}/import-from-events")
async def import_from_events(
    list_id: str,
    event_filter: EventAudienceFilter
):
    """Import attendees from events into a mailing list"""
    try:
        appwrite = AppwriteService()
        
        added = 0
        duplicates = 0
        
        for event_id in event_filter.event_ids:
            # Get attendees from event
            attendees = appwrite.list_documents(
                EVENTS_ATTENDEES_COLLECTION,
                queries=[
                    AppwriteQuery.equal("event_id", event_id),
                    AppwriteQuery.limit(1000)
                ]
            )
            
            for attendee in attendees.get("documents", []):
                # Filter by approval/verification status based on booleans
                is_approved = attendee.get("approved", False)
                is_verified = attendee.get("verified", False)
                
                # Check if attendee matches any of the selected filters
                matches = False
                if event_filter.include_registered:
                    matches = True  # All registered attendees
                if event_filter.include_approved and is_approved:
                    matches = True
                if event_filter.include_verified and is_verified:
                    matches = True
                
                if not matches:
                    continue
                
                email = attendee.get("email", "").strip().lower()
                if not email:
                    continue
                
                # Build name from first_name + last_name
                first_name = attendee.get("first_name", "")
                last_name = attendee.get("last_name", "")
                name = f"{first_name} {last_name}".strip()
                
                # Check if already subscribed to this list
                existing = appwrite.list_documents(
                    SUBSCRIBERS_COLLECTION,
                    queries=[
                        AppwriteQuery.equal("list_id", list_id),
                        AppwriteQuery.equal("email", email)
                    ]
                )
                
                if existing.get("total", 0) > 0:
                    duplicates += 1
                    continue
                
                now = datetime.now(timezone.utc).isoformat()
                doc_data = {
                    "list_id": list_id,
                    "email": email,
                    "name": name,
                    "subscribed": True,
                    "source": "event",
                    "event_ids": json.dumps([event_id]),
                    "subscribed_at": now
                }
                
                appwrite.create_document(
                    SUBSCRIBERS_COLLECTION,
                    document_id=ID.unique(),
                    data=doc_data
                )
                added += 1
        
        # Update subscriber count
        await _update_list_subscriber_count(appwrite, list_id)
        
        return {
            "success": True,
            "added": added,
            "duplicates": duplicates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EMAIL CAMPAIGNS ====================

@router.get("/", response_model=List[CampaignResponse])
async def get_campaigns(
    owner_email: str = Query(..., description="Owner's email address"),
    status: Optional[CampaignStatus] = Query(None, description="Filter by status")
):
    """Get all campaigns for a user"""
    try:
        appwrite = AppwriteService()
        
        queries = [
            AppwriteQuery.equal("owner_email", owner_email),
            AppwriteQuery.order_desc("created_at"),
            AppwriteQuery.limit(100)
        ]
        
        if status:
            queries.append(AppwriteQuery.equal("status", status.value))
        
        result = appwrite.list_documents(
            CAMPAIGNS_COLLECTION,
            queries=queries
        )
        
        campaigns = [_parse_campaign_response(doc) for doc in result.get("documents", [])]
        return campaigns
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=CampaignResponse)
async def create_campaign(
    data: CampaignCreate,
    owner_email: str = Query(..., description="Owner's email address")
):
    """Create a new email campaign"""
    try:
        appwrite = AppwriteService()
        now = datetime.now(timezone.utc).isoformat()
        
        # Determine initial status based on scheduled_at
        status = "scheduled" if data.scheduled_at else "draft"
        
        doc_data = {
            "owner_email": owner_email,
            "title": data.title,
            "subject": data.subject,
            "sender_name": data.sender_name,
            "sender_logo_url": data.sender_logo_url or "",
            "reply_to_email": data.reply_to_email or "",
            "content_html": data.content_html,
            "content_json": data.content_json or "",
            "status": status,
            "recipient_list_ids": json.dumps(data.recipient_list_ids) if data.recipient_list_ids else "",
            "recipient_event_ids": json.dumps(data.recipient_event_ids) if data.recipient_event_ids else "",
            "recipient_filter": data.recipient_filter or "all",
            "total_recipients": 0,
            "sent_count": 0,
            "failed_count": 0,
            "open_count": 0,
            "click_count": 0,
            "unsubscribe_count": 0,
            "bounce_count": 0,
            "created_at": now,
            "updated_at": now
        }
        
        if data.scheduled_at:
            doc_data["scheduled_at"] = data.scheduled_at.isoformat()
        
        result = appwrite.create_document(
            CAMPAIGNS_COLLECTION,
            data=doc_data
        )
        
        return _parse_campaign_response(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str):
    """Get a single campaign"""
    try:
        appwrite = AppwriteService()
        doc = appwrite.get_document(
            CAMPAIGNS_COLLECTION,
            campaign_id
        )
        
        return _parse_campaign_response(doc)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Campaign not found")


@router.patch("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: str, data: CampaignUpdate):
    """Update a campaign"""
    try:
        appwrite = AppwriteService()
        
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        if data.title is not None:
            update_data["title"] = data.title
        if data.subject is not None:
            update_data["subject"] = data.subject
        if data.sender_name is not None:
            update_data["sender_name"] = data.sender_name
        if data.sender_logo_url is not None:
            update_data["sender_logo_url"] = data.sender_logo_url
        if data.reply_to_email is not None:
            update_data["reply_to_email"] = data.reply_to_email
        if data.content_html is not None:
            update_data["content_html"] = data.content_html
        if data.content_json is not None:
            update_data["content_json"] = data.content_json
        if data.recipient_list_ids is not None:
            update_data["recipient_list_ids"] = json.dumps(data.recipient_list_ids)
        if data.recipient_event_ids is not None:
            update_data["recipient_event_ids"] = json.dumps(data.recipient_event_ids)
        if data.recipient_filter is not None:
            update_data["recipient_filter"] = data.recipient_filter
        if data.scheduled_at is not None:
            update_data["scheduled_at"] = data.scheduled_at.isoformat()
            # If scheduling, update status to scheduled
            if data.status is None:
                update_data["status"] = "scheduled"
        if data.status is not None:
            update_data["status"] = data.status.value
        
        result = appwrite.update_document(
            CAMPAIGNS_COLLECTION,
            campaign_id,
            data=update_data
        )
        
        return _parse_campaign_response(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """Delete a campaign"""
    try:
        appwrite = AppwriteService()
        
        # Delete associated recipients
        recipients = appwrite.list_documents(
            RECIPIENTS_COLLECTION,
            queries=[
                AppwriteQuery.equal("campaign_id", campaign_id),
                AppwriteQuery.limit(1000)
            ]
        )
        
        for recipient in recipients.get("documents", []):
            appwrite.delete_document(
                RECIPIENTS_COLLECTION,
                recipient["$id"]
            )
        
        # Delete the campaign
        appwrite.delete_document(
            CAMPAIGNS_COLLECTION,
            campaign_id
        )
        
        return {"success": True, "message": "Campaign deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{campaign_id}/duplicate", response_model=CampaignResponse)
async def duplicate_campaign(campaign_id: str):
    """
    Duplicate an existing campaign as a new draft.
    Copies all content and settings but resets status, counters, and timestamps.
    Used for resending sent campaigns with optional edits.
    """
    try:
        appwrite = AppwriteService()
        
        # Get the original campaign
        original = appwrite.get_document(CAMPAIGNS_COLLECTION, campaign_id)
        now = datetime.now(timezone.utc).isoformat()
        
        # Create a new campaign with the same content
        doc_data = {
            "owner_email": original["owner_email"],
            "title": f"{original['title']} (copy)",
            "subject": original["subject"],
            "sender_name": original["sender_name"],
            "sender_logo_url": original.get("sender_logo_url", ""),
            "reply_to_email": original.get("reply_to_email", ""),
            "content_html": original["content_html"],
            "content_json": original.get("content_json", ""),
            "status": "draft",
            "recipient_list_ids": original.get("recipient_list_ids", ""),
            "recipient_event_ids": original.get("recipient_event_ids", ""),
            "recipient_filter": original.get("recipient_filter", "all"),
            "total_recipients": 0,
            "sent_count": 0,
            "failed_count": 0,
            "open_count": 0,
            "click_count": 0,
            "unsubscribe_count": 0,
            "bounce_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        
        result = appwrite.create_document(CAMPAIGNS_COLLECTION, data=doc_data)
        return _parse_campaign_response(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AUDIENCE PREVIEW ====================

@router.post("/{campaign_id}/preview-audience", response_model=AudiencePreviewResponse)
async def preview_audience(campaign_id: str, audience: AudienceSelection):
    """Preview the audience for a campaign before sending"""
    try:
        appwrite = AppwriteService()
        
        all_emails = {}  # email -> name mapping for deduplication
        from_lists = 0
        from_events = 0
        from_manual = 0
        from_team = 0
        
        # From mailing lists
        for list_id in audience.list_ids:
            subscribers = appwrite.list_documents(
                SUBSCRIBERS_COLLECTION,
                queries=[
                    AppwriteQuery.equal("list_id", list_id),
                    AppwriteQuery.equal("subscribed", True),
                    AppwriteQuery.limit(1000)
                ]
            )
            
            for sub in subscribers.get("documents", []):
                email = sub.get("email", "").lower()
                if email and email not in all_emails:
                    all_emails[email] = sub.get("name", "")
                    from_lists += 1
        
        # From events
        if audience.event_filter:
            for event_id in audience.event_filter.event_ids:
                statuses = []
                if audience.event_filter.include_registered:
                    statuses.append("registered")
                if audience.event_filter.include_approved:
                    statuses.append("approved")
                if audience.event_filter.include_verified:
                    statuses.append("verified")
                
                attendees = appwrite.list_documents(
                    EVENTS_ATTENDEES_COLLECTION,
                    queries=[
                        AppwriteQuery.equal("event_id", event_id),
                        AppwriteQuery.limit(1000)
                    ]
                )
                
                for attendee in attendees.get("documents", []):
                    if attendee.get("status") not in statuses:
                        continue
                    email = attendee.get("email", "").lower()
                    if email and email not in all_emails:
                        all_emails[email] = attendee.get("name", "")
                        from_events += 1
        
        # Manual additions
        for sub in audience.manual_emails:
            email = sub.email.lower()
            if email not in all_emails:
                all_emails[email] = sub.name or ""
                from_manual += 1
        
        # Calculate duplicates removed
        total_before_dedup = from_lists + from_events + from_manual + from_team
        duplicate_removed = total_before_dedup - len(all_emails) if total_before_dedup > len(all_emails) else 0
        
        # Get first 10 emails for preview
        emails_preview = list(all_emails.keys())[:10]
        
        return AudiencePreviewResponse(
            total_count=len(all_emails),
            from_lists=from_lists,
            from_events=from_events,
            from_manual=from_manual,
            from_team=from_team,
            duplicate_removed=duplicate_removed,
            emails_preview=emails_preview
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SEND CAMPAIGN ====================

@router.post("/{campaign_id}/send", response_model=SendCampaignResponse)
async def send_campaign(
    campaign_id: str,
    send_request: SendCampaignRequest,
    background_tasks: BackgroundTasks,
    acknowledged: bool = Query(False, description="User has acknowledged spam warning")
):
    """
    Send a campaign to all recipients.
    Delegates actual email sending to the newsletter microservice.
    User must acknowledge spam warning before sending.
    """
    if not acknowledged:
        raise HTTPException(
            status_code=400, 
            detail="You must acknowledge that all recipients have agreed to receive emails. Your account may be banned if flagged as spam."
        )
    
    try:
        appwrite = AppwriteService()
        
        # Get campaign
        campaign = appwrite.get_document(
            CAMPAIGNS_COLLECTION,
            campaign_id
        )
        
        if campaign.get("status") == "sending":
            raise HTTPException(status_code=400, detail="Campaign is currently being sent. Please wait for it to finish.")
        
        # Get recipient_list_ids
        list_ids = []
        if campaign.get("recipient_list_ids"):
            try:
                list_ids = json.loads(campaign["recipient_list_ids"])
            except:
                pass
        
        if not list_ids:
            raise HTTPException(status_code=400, detail="No mailing lists selected for this campaign")
        
        # Collect all unique recipients
        all_recipients = {}  # email -> name
        
        for list_id in list_ids:
            subscribers = appwrite.list_documents(
                SUBSCRIBERS_COLLECTION,
                queries=[
                    AppwriteQuery.equal("list_id", list_id),
                    AppwriteQuery.equal("subscribed", True),
                    AppwriteQuery.limit(1000)
                ]
            )
            
            for sub in subscribers.get("documents", []):
                email = sub.get("email", "").lower()
                if email and email not in all_recipients:
                    all_recipients[email] = sub.get("name", "")
        
        if not all_recipients:
            raise HTTPException(status_code=400, detail="No subscribers found in selected lists")
        
        total_recipients = len(all_recipients)
        
        # Handle scheduling - check if scheduled_at is provided
        if send_request.scheduled_at:
            # Update campaign status
            appwrite.update_document(
                CAMPAIGNS_COLLECTION,
                campaign_id,
                data={
                    "status": "scheduled",
                    "scheduled_at": send_request.scheduled_at.isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            # Create scheduled campaign entry
            appwrite.create_document(
                SCHEDULED_COLLECTION,
                data={
                    "campaign_id": campaign_id,
                    "owner_email": campaign.get("owner_email"),
                    "scheduled_at": send_request.scheduled_at.isoformat(),
                    "status": "pending",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            return SendCampaignResponse(
                campaign_id=campaign_id,
                status=CampaignStatus.SCHEDULED,
                total_recipients=total_recipients,
                message=f"Campaign scheduled for {send_request.scheduled_at.isoformat()}"
            )
        
        # Immediate send - update status
        appwrite.update_document(
            CAMPAIGNS_COLLECTION,
            campaign_id,
            data={
                "status": "sending",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Create recipient records and collect their doc IDs
        recipient_infos = []
        for email, name in all_recipients.items():
            rdoc = appwrite.create_document(
                RECIPIENTS_COLLECTION,
                document_id=ID.unique(),
                data={
                    "campaign_id": campaign_id,
                    "email": email,
                    "name": name,
                    "status": "pending"
                }
            )
            recipient_infos.append({
                "email": email,
                "name": name,
                "recipient_doc_id": rdoc["$id"]
            })
        
        # Create analytics record (field names match campaign-analytics schema)
        analytics_doc = appwrite.create_document(
            ANALYTICS_COLLECTION,
            document_id=ID.unique(),
            data={
                "campaign_id": campaign_id,
                "total_recipients": len(all_recipients),
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
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Delegate sending to the newsletter microservice
        background_tasks.add_task(
            _delegate_to_newsletter_service,
            campaign_id=campaign_id,
            subject=campaign["subject"],
            content_html=campaign["content_html"],
            sender_name=campaign["sender_name"],
            owner_email=campaign["owner_email"],
            list_id=list_ids[0] if list_ids else "",
            sender_logo_url=campaign.get("sender_logo_url", "") or "",
            reply_to_email=campaign.get("reply_to_email", "") or "",
            recipients=recipient_infos,
            analytics_doc_id=analytics_doc["$id"],
        )
        
        return SendCampaignResponse(
            campaign_id=campaign_id,
            status=CampaignStatus.SENDING,
            total_recipients=total_recipients,
            message=f"Sending to {total_recipients} recipients"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _delegate_to_newsletter_service(
    campaign_id: str,
    subject: str,
    content_html: str,
    sender_name: str,
    owner_email: str,
    list_id: str,
    sender_logo_url: str,
    reply_to_email: str,
    recipients: list,
    analytics_doc_id: str,
):
    """
    Background task that POSTs the campaign to the newsletter microservice.
    If the microservice is unreachable, falls back to sending locally.
    """
    service_url = settings.NEWSLETTER_SERVICE_URL
    service_secret = settings.NEWSLETTER_SERVICE_SECRET

    payload = {
        "campaign_id": campaign_id,
        "subject": subject,
        "content_html": content_html,
        "sender_name": sender_name,
        "owner_email": owner_email,
        "list_id": list_id,
        "sender_logo_url": sender_logo_url,
        "reply_to_email": reply_to_email,
        "recipients": recipients,
        "analytics_doc_id": analytics_doc_id,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{service_url}/api/newsletter/send",
                json=payload,
                headers={"X-Service-Secret": service_secret},
            )

        if resp.status_code in (200, 201):
            data = resp.json()
            logger.info(
                f"Campaign {campaign_id} delegated to newsletter service: "
                f"job_id={data.get('job_id')}"
            )
            return
        else:
            logger.warning(
                f"Newsletter service returned {resp.status_code}: {resp.text}. "
                f"Falling back to local send."
            )
    except Exception as e:
        logger.warning(
            f"Newsletter service unreachable ({e}). Falling back to local send."
        )

    # ── Fallback: send locally (same logic as before) ──
    await _send_campaign_emails_locally(
        campaign_id, content_html, subject, sender_name,
        owner_email, list_id, sender_logo_url, reply_to_email,
    )


async def _send_campaign_emails_locally(
    campaign_id: str,
    content_html: str,
    subject: str,
    sender_name: str,
    owner_email: str,
    list_id: str,
    sender_logo_url: str = "",
    reply_to_email: str = "",
):
    """Fallback: send emails directly from the main backend if microservice is down."""
    from services.campaign_email_service import CampaignEmailService

    email_service = None
    try:
        appwrite = AppwriteService()
        email_service = CampaignEmailService()

        logger.info(f"Campaign {campaign_id}: Local fallback send starting...")

        recipients = appwrite.list_documents(
            RECIPIENTS_COLLECTION,
            queries=[
                AppwriteQuery.equal("campaign_id", campaign_id),
                AppwriteQuery.equal("status", "pending"),
                AppwriteQuery.limit(1000),
            ],
        )

        recipient_docs = recipients.get("documents", [])
        total = len(recipient_docs)

        if total == 0:
            appwrite.update_document(
                CAMPAIGNS_COLLECTION, campaign_id,
                data={"status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()},
            )
            return

        sent_count = 0
        failed_count = 0

        for i, recipient in enumerate(recipient_docs):
            try:
                result = await email_service.send_campaign_email(
                    campaign_id=campaign_id,
                    recipient_email=recipient["email"],
                    recipient_name=recipient.get("name", ""),
                    subject=subject,
                    html_content=content_html,
                    sender_name=sender_name,
                    list_id=list_id,
                    sender_logo_url=sender_logo_url,
                    reply_to_email=reply_to_email,
                )
                if result.get("success"):
                    appwrite.update_document(
                        RECIPIENTS_COLLECTION, recipient["$id"],
                        data={"status": "sent", "sent_at": datetime.now(timezone.utc).isoformat()},
                    )
                    sent_count += 1
                else:
                    failed_count += 1
                    appwrite.update_document(
                        RECIPIENTS_COLLECTION, recipient["$id"],
                        data={"status": "failed", "error_message": str(result.get("error", ""))[:1000]},
                    )
            except Exception as e:
                failed_count += 1
                try:
                    appwrite.update_document(
                        RECIPIENTS_COLLECTION, recipient["$id"],
                        data={"status": "failed", "error_message": str(e)[:1000]},
                    )
                except Exception:
                    pass

            if i < total - 1:
                await asyncio.sleep(0.3)

        final_status = "sent" if sent_count > 0 else "failed"
        appwrite.update_document(
            CAMPAIGNS_COLLECTION, campaign_id,
            data={
                "status": final_status,
                "sent_count": sent_count,
                "failed_count": failed_count,
                "total_recipients": sent_count + failed_count,
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        analytics = appwrite.list_documents(
            ANALYTICS_COLLECTION,
            queries=[AppwriteQuery.equal("campaign_id", campaign_id)],
        )
        if analytics.get("documents"):
            appwrite.update_document(
                ANALYTICS_COLLECTION, analytics["documents"][0]["$id"],
                data={
                    "sent_count": sent_count,
                    "bounced_count": failed_count,
                    "total_recipients": sent_count + failed_count,
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                },
            )

        logger.info(f"Campaign {campaign_id} local send complete: {sent_count} sent, {failed_count} failed")

    except Exception as e:
        logger.error(f"Campaign {campaign_id} local send failed: {e}", exc_info=True)
        try:
            AppwriteService().update_document(
                CAMPAIGNS_COLLECTION, campaign_id,
                data={"status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()},
            )
        except Exception:
            pass
    finally:
        if email_service:
            email_service.close()


# ==================== TRACKING ENDPOINTS ====================

@router.get("/track/open/{campaign_id}/{recipient_hash}")
async def track_open(campaign_id: str, recipient_hash: str, request: Request):
    """Track email opens via tracking pixel"""
    try:
        appwrite = AppwriteService()
        
        # Find recipient by hash
        recipients = appwrite.list_documents(
            RECIPIENTS_COLLECTION,
            queries=[
                AppwriteQuery.equal("campaign_id", campaign_id),
                AppwriteQuery.limit(1000)
            ]
        )
        
        recipient_email = None
        recipient_doc = None
        
        for r in recipients.get("documents", []):
            email_hash = hashlib.md5(r["email"].lower().encode()).hexdigest()
            if email_hash == recipient_hash:
                recipient_email = r["email"]
                recipient_doc = r
                break
        
        if recipient_doc:
            now = datetime.now(timezone.utc).isoformat()
            
            # Update recipient
            open_count = recipient_doc.get("open_count", 0) + 1
            update_data = {"open_count": open_count}
            
            if not recipient_doc.get("opened_at"):
                update_data["opened_at"] = now
                update_data["status"] = "opened"
            
            appwrite.update_document(
                RECIPIENTS_COLLECTION,
                recipient_doc["$id"],
                data=update_data
            )
            
            # Log event
            appwrite.create_document(
                EVENTS_COLLECTION,
                document_id=ID.unique(),
                data={
                    "campaign_id": campaign_id,
                    "recipient_email": recipient_email,
                    "event_type": "opened",
                    "user_agent": request.headers.get("user-agent", ""),
                    "ip_address": request.client.host if request.client else "",
                    "created_at": now
                }
            )
            
            # Update analytics
            await _update_campaign_analytics(appwrite, campaign_id)
        
        # Return 1x1 transparent GIF
        gif_data = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
        return Response(content=gif_data, media_type="image/gif")
    except Exception as e:
        print(f"Track open error: {e}")
        # Still return pixel even on error
        gif_data = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
        return Response(content=gif_data, media_type="image/gif")


@router.get("/track/click/{campaign_id}/{recipient_hash}")
async def track_click(
    campaign_id: str, 
    recipient_hash: str, 
    url: str = Query(..., description="Original URL"),
    request: Request = None
):
    """Track link clicks and redirect to original URL"""
    from urllib.parse import unquote
    
    # Decode the URL in case of double-encoding by email clients
    redirect_url = unquote(url)
    # Ensure it's a valid absolute URL, not a relative path
    if not redirect_url.startswith(('http://', 'https://')):
        redirect_url = 'https://' + redirect_url
    
    try:
        appwrite = AppwriteService()
        
        # Find recipient by hash
        recipients = appwrite.list_documents(
            RECIPIENTS_COLLECTION,
            queries=[
                AppwriteQuery.equal("campaign_id", campaign_id),
                AppwriteQuery.limit(1000)
            ]
        )
        
        recipient_email = None
        recipient_doc = None
        
        for r in recipients.get("documents", []):
            email_hash = hashlib.md5(r["email"].lower().encode()).hexdigest()
            if email_hash == recipient_hash:
                recipient_email = r["email"]
                recipient_doc = r
                break
        
        if recipient_doc:
            now = datetime.now(timezone.utc).isoformat()
            
            # Update recipient
            click_count = recipient_doc.get("click_count", 0) + 1
            update_data = {"click_count": click_count}
            
            if not recipient_doc.get("clicked_at"):
                update_data["clicked_at"] = now
                update_data["status"] = "clicked"
            
            appwrite.update_document(
                RECIPIENTS_COLLECTION,
                recipient_doc["$id"],
                data=update_data
            )
            
            # Log event
            appwrite.create_document(
                EVENTS_COLLECTION,
                document_id=ID.unique(),
                data={
                    "campaign_id": campaign_id,
                    "recipient_email": recipient_email,
                    "event_type": "clicked",
                    "link_url": url,
                    "user_agent": request.headers.get("user-agent", "") if request else "",
                    "ip_address": request.client.host if request and request.client else "",
                    "created_at": now
                }
            )
            
            # Update analytics
            await _update_campaign_analytics(appwrite, campaign_id)
    except Exception as e:
        print(f"Track click error: {e}")
    
    # Always redirect to the original URL
    return RedirectResponse(url=redirect_url, status_code=302)


async def _update_campaign_analytics(appwrite: AppwriteService, campaign_id: str):
    """Update campaign analytics based on current recipient states"""
    try:
        recipients = appwrite.list_documents(
            RECIPIENTS_COLLECTION,
            queries=[
                AppwriteQuery.equal("campaign_id", campaign_id),
                AppwriteQuery.limit(1000)
            ]
        )
        
        total = len(recipients.get("documents", []))
        sent = sum(1 for r in recipients.get("documents", []) if r.get("sent_at"))
        delivered = sum(1 for r in recipients.get("documents", []) if r.get("delivered_at") or r.get("opened_at"))
        opened = sum(1 for r in recipients.get("documents", []) if r.get("opened_at"))
        clicked = sum(1 for r in recipients.get("documents", []) if r.get("clicked_at"))
        bounced = sum(1 for r in recipients.get("documents", []) if r.get("bounced_at"))
        unsubscribed = sum(1 for r in recipients.get("documents", []) if r.get("unsubscribed_at"))
        
        total_opens = sum(r.get("open_count", 0) for r in recipients.get("documents", []))
        total_clicks = sum(r.get("click_count", 0) for r in recipients.get("documents", []))
        
        analytics = appwrite.list_documents(
            ANALYTICS_COLLECTION,
            queries=[AppwriteQuery.equal("campaign_id", campaign_id)]
        )
        
        if analytics.get("documents"):
            appwrite.update_document(
                ANALYTICS_COLLECTION,
                analytics["documents"][0]["$id"],
                data={
                    "total_recipients": total,
                    "sent_count": sent,
                    "delivered_count": delivered,
                    "opened_count": total_opens,
                    "unique_opens": opened,
                    "clicked_count": total_clicks,
                    "unique_clicks": clicked,
                    "bounced_count": bounced,
                    "unsubscribed_count": unsubscribed,
                    "open_rate": (opened / sent * 100) if sent > 0 else 0,
                    "click_rate": (clicked / sent * 100) if sent > 0 else 0,
                    "bounce_rate": (bounced / total * 100) if total > 0 else 0,
                    "last_updated": datetime.now(timezone.utc).isoformat()
                }
            )
    except Exception as e:
        print(f"Failed to update analytics: {e}")


# ==================== UNSUBSCRIBE ====================

@router.get("/unsubscribe/{campaign_id}/{list_id}/{recipient_hash}")
async def unsubscribe_page(campaign_id: str, list_id: str, recipient_hash: str):
    """Legacy redirect - redirect to new unsubscribe page"""
    return RedirectResponse(
        url=f"https://sinod.app/unsubscribe",
        status_code=302
    )


@router.post("/unsubscribe/lookup")
async def unsubscribe_lookup(data: dict):
    """
    Public endpoint: Look up all mailing lists an email is subscribed to.
    Returns list names and descriptions so user can choose which to unsubscribe from.
    """
    try:
        email = data.get("email", "").strip().lower()
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        appwrite = AppwriteService()

        # Find all subscriber records for this email that are still active
        subscribers = appwrite.list_documents(
            SUBSCRIBERS_COLLECTION,
            queries=[
                AppwriteQuery.equal("email", email),
                AppwriteQuery.equal("subscribed", True),
                AppwriteQuery.limit(100)
            ]
        )

        if not subscribers.get("documents"):
            return {"success": True, "lists": [], "message": "No active subscriptions found for this email."}

        # Gather list details for each subscription
        lists = []
        seen_list_ids = set()

        for sub in subscribers["documents"]:
            list_id = sub.get("list_id", "")
            if not list_id or list_id in seen_list_ids:
                continue
            seen_list_ids.add(list_id)

            try:
                mailing_list = appwrite.get_document(MAILING_LISTS_COLLECTION, list_id)
                lists.append({
                    "list_id": list_id,
                    "name": mailing_list.get("name", "Unknown List"),
                    "description": mailing_list.get("description", ""),
                    "owner_email": mailing_list.get("owner_email", ""),
                    "subscriber_id": sub["$id"],
                    "subscribed_at": sub.get("subscribed_at", ""),
                    "source": sub.get("source", "manual"),
                })
            except Exception:
                # List may have been deleted
                lists.append({
                    "list_id": list_id,
                    "name": "Unknown List",
                    "description": "This mailing list may no longer exist.",
                    "owner_email": "",
                    "subscriber_id": sub["$id"],
                    "subscribed_at": sub.get("subscribed_at", ""),
                    "source": sub.get("source", "manual"),
                })

        return {"success": True, "lists": lists}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unsubscribe/confirm")
async def unsubscribe_confirm(data: dict):
    """
    Public endpoint: Unsubscribe an email from selected mailing lists.
    Expects: { email: str, list_ids: [str], reason: str?, details: str? }
    """
    try:
        email = data.get("email", "").strip().lower()
        list_ids = data.get("list_ids", [])
        reason = data.get("reason", "")
        details = data.get("details", "")

        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        if not list_ids:
            raise HTTPException(status_code=400, detail="Please select at least one mailing list")

        appwrite = AppwriteService()
        notification_service = NotificationService()
        now = datetime.now(timezone.utc).isoformat()

        unsubscribed_count = 0

        for list_id in list_ids:
            # Find subscriber in this list
            subscribers = appwrite.list_documents(
                SUBSCRIBERS_COLLECTION,
                queries=[
                    AppwriteQuery.equal("list_id", list_id),
                    AppwriteQuery.equal("email", email),
                    AppwriteQuery.limit(1)
                ]
            )

            if not subscribers.get("documents"):
                continue

            sub_doc = subscribers["documents"][0]

            # Update subscriber to unsubscribed
            appwrite.update_document(
                SUBSCRIBERS_COLLECTION,
                sub_doc["$id"],
                data={
                    "subscribed": False,
                    "unsubscribed_at": now,
                    "unsubscribe_reason": reason or ""
                }
            )

            # Update subscriber count
            await _update_list_subscriber_count(appwrite, list_id)

            # Log unsubscribe
            try:
                mailing_list = appwrite.get_document(MAILING_LISTS_COLLECTION, list_id)
                owner_email = mailing_list.get("owner_email", "")
                list_name = mailing_list.get("name", "Unknown List")

                appwrite.create_document(
                    UNSUBSCRIBES_COLLECTION,
                    document_id=ID.unique(),
                    data={
                        "list_id": list_id,
                        "email": email,
                        "name": "",
                        "reason": reason or "",
                        "owner_email": owner_email,
                        "unsubscribed_at": now
                    }
                )

                # Notify list owner
                reason_text = reason if reason else "No reason provided"
                notification_message = f"📧 {email} unsubscribed from '{list_name}'. Reason: {reason_text}"
                if details:
                    notification_message += f" Details: {details}"

                await notification_service.create_notification(
                    user_email=owner_email,
                    title="Subscriber Unsubscribed",
                    message=notification_message,
                    notification_type="newsletter",
                    link=f"/dashboard/mailing-lists/{list_id}"
                )
            except Exception as e:
                logger.error(f"Failed to log unsubscribe for list {list_id}: {e}")

            unsubscribed_count += 1

        if unsubscribed_count == 0:
            return {"success": False, "message": "No matching subscriptions found."}

        return {
            "success": True,
            "message": f"Successfully unsubscribed from {unsubscribed_count} mailing list(s).",
            "unsubscribed_count": unsubscribed_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unsubscribe/{campaign_id}/{list_id}/{recipient_hash}", response_model=UnsubscribeResponse)
async def process_unsubscribe_legacy(
    campaign_id: str,
    list_id: str,
    recipient_hash: str,
    data: UnsubscribeRequest
):
    """Legacy unsubscribe endpoint - kept for backward compatibility"""
    try:
        appwrite = AppwriteService()
        notification_service = NotificationService()
        
        # Find subscriber by hash
        subscribers = appwrite.list_documents(
            SUBSCRIBERS_COLLECTION,
            queries=[
                AppwriteQuery.equal("list_id", list_id),
                AppwriteQuery.limit(1000)
            ]
        )
        
        subscriber_doc = None
        subscriber_email = None
        
        for s in subscribers.get("documents", []):
            email_hash = hashlib.md5(s["email"].lower().encode()).hexdigest()
            if email_hash == recipient_hash:
                subscriber_doc = s
                subscriber_email = s["email"]
                break
        
        if not subscriber_doc:
            raise HTTPException(status_code=404, detail="Subscriber not found")
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Update subscriber
        appwrite.update_document(
            SUBSCRIBERS_COLLECTION,
            subscriber_doc["$id"],
            data={
                "subscribed": False,
                "unsubscribed_at": now,
                "unsubscribe_reason": data.reason or ""
            }
        )
        
        # Update subscriber count
        await _update_list_subscriber_count(appwrite, list_id)
        
        # Get list owner email
        mailing_list = appwrite.get_document(
            MAILING_LISTS_COLLECTION,
            list_id
        )
        
        owner_email = mailing_list.get("owner_email")
        list_name = mailing_list.get("name", "Unknown List")
        
        # Record unsubscribe
        appwrite.create_document(
            UNSUBSCRIBES_COLLECTION,
            document_id=ID.unique(),
            data={
                "list_id": list_id,
                "email": subscriber_email,
                "name": "",
                "reason": data.reason or "",
                "owner_email": owner_email,
                "unsubscribed_at": now
            }
        )
        
        # NOTIFY LIST OWNER
        reason_text = data.reason if data.reason else "No reason provided"
        details_text = data.details if data.details else ""
        
        notification_message = f"📧 {subscriber_email} unsubscribed from '{list_name}'. Reason: {reason_text}"
        if details_text:
            notification_message += f" Details: {details_text}"
        
        await notification_service.create_notification(
            user_email=owner_email,
            title="Subscriber Unsubscribed",
            message=notification_message,
            notification_type="newsletter",
            link=f"/dashboard/mailing-lists/{list_id}"
        )
        
        return UnsubscribeResponse(
            success=True,
            message="You have been unsubscribed successfully."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ANALYTICS ====================

@router.get("/{campaign_id}/analytics", response_model=CampaignAnalyticsResponse)
async def get_campaign_analytics(campaign_id: str):
    """Get analytics for a campaign"""
    try:
        appwrite = AppwriteService()
        
        analytics = appwrite.list_documents(
            ANALYTICS_COLLECTION,
            queries=[AppwriteQuery.equal("campaign_id", campaign_id)]
        )
        
        if not analytics.get("documents"):
            raise HTTPException(status_code=404, detail="Analytics not found")
        
        doc = analytics["documents"][0]
        
        return CampaignAnalyticsResponse(
            id=doc["$id"],
            campaign_id=doc["campaign_id"],
            total_recipients=doc.get("total_recipients", 0),
            sent_count=doc.get("sent_count", 0),
            delivered_count=doc.get("delivered_count", 0),
            opened_count=doc.get("opened_count", 0),
            unique_opens=doc.get("unique_opens", 0),
            clicked_count=doc.get("clicked_count", 0),
            unique_clicks=doc.get("unique_clicks", 0),
            bounced_count=doc.get("bounced_count", 0),
            unsubscribed_count=doc.get("unsubscribed_count", 0),
            open_rate=doc.get("open_rate", 0.0),
            click_rate=doc.get("click_rate", 0.0),
            bounce_rate=doc.get("bounce_rate", 0.0),
            last_updated=datetime.fromisoformat(doc["last_updated"].replace("Z", "+00:00"))
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}/recipients", response_model=List[CampaignRecipientResponse])
async def get_campaign_recipients(
    campaign_id: str,
    status: Optional[RecipientStatus] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Get recipients for a campaign with optional status filter"""
    try:
        appwrite = AppwriteService()
        
        queries = [
            AppwriteQuery.equal("campaign_id", campaign_id),
            AppwriteQuery.limit(limit),
            AppwriteQuery.offset(offset)
        ]
        
        if status:
            queries.append(AppwriteQuery.equal("status", status.value))
        
        result = appwrite.list_documents(
            RECIPIENTS_COLLECTION,
            queries=queries
        )
        
        recipients = []
        for doc in result.get("documents", []):
            recipients.append(CampaignRecipientResponse(
                id=doc["$id"],
                campaign_id=doc["campaign_id"],
                email=doc["email"],
                name=doc.get("name", ""),
                status=RecipientStatus(doc.get("status", "pending")),
                sent_at=datetime.fromisoformat(doc["sent_at"].replace("Z", "+00:00")) if doc.get("sent_at") else None,
                delivered_at=datetime.fromisoformat(doc["delivered_at"].replace("Z", "+00:00")) if doc.get("delivered_at") else None,
                opened_at=datetime.fromisoformat(doc["opened_at"].replace("Z", "+00:00")) if doc.get("opened_at") else None,
                open_count=doc.get("open_count", 0),
                clicked_at=datetime.fromisoformat(doc["clicked_at"].replace("Z", "+00:00")) if doc.get("clicked_at") else None,
                click_count=doc.get("click_count", 0),
                bounced_at=datetime.fromisoformat(doc["bounced_at"].replace("Z", "+00:00")) if doc.get("bounced_at") else None,
                bounce_reason=doc.get("bounce_reason"),
                unsubscribed_at=datetime.fromisoformat(doc["unsubscribed_at"].replace("Z", "+00:00")) if doc.get("unsubscribed_at") else None
            ))
        
        return recipients
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TEMPLATES ====================

@router.get("/templates", response_model=List[TemplateResponse])
async def get_templates(
    owner_email: str = Query(..., description="Owner's email address"),
    include_public: bool = Query(True, description="Include public templates")
):
    """Get email templates"""
    try:
        appwrite = AppwriteService()
        
        # Get user's own templates
        own_templates = appwrite.list_documents(
            TEMPLATES_COLLECTION,
            queries=[
                AppwriteQuery.equal("owner_email", owner_email),
                AppwriteQuery.order_desc("created_at"),
                AppwriteQuery.limit(50)
            ]
        )
        
        templates = []
        seen_ids = set()
        
        for doc in own_templates.get("documents", []):
            seen_ids.add(doc["$id"])
            templates.append(TemplateResponse(
                id=doc["$id"],
                owner_email=doc["owner_email"],
                name=doc["name"],
                description=doc.get("description", ""),
                content_json=doc["content_json"],
                content_html=doc.get("content_html"),
                is_public=doc.get("is_public", False),
                created_at=datetime.fromisoformat(doc["created_at"].replace("Z", "+00:00")),
                updated_at=datetime.fromisoformat(doc["updated_at"].replace("Z", "+00:00"))
            ))
        
        # Get public templates
        if include_public:
            public_templates = appwrite.list_documents(
                TEMPLATES_COLLECTION,
                queries=[
                    AppwriteQuery.equal("is_public", True),
                    AppwriteQuery.order_desc("created_at"),
                    AppwriteQuery.limit(50)
                ]
            )
            
            for doc in public_templates.get("documents", []):
                if doc["$id"] not in seen_ids:
                    templates.append(TemplateResponse(
                        id=doc["$id"],
                        owner_email=doc["owner_email"],
                        name=doc["name"],
                        description=doc.get("description", ""),
                        content_json=doc["content_json"],
                        content_html=doc.get("content_html"),
                        is_public=doc.get("is_public", False),
                        created_at=datetime.fromisoformat(doc["created_at"].replace("Z", "+00:00")),
                        updated_at=datetime.fromisoformat(doc["updated_at"].replace("Z", "+00:00"))
                    ))
        
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/templates", response_model=TemplateResponse)
async def create_template(
    data: TemplateCreate,
    owner_email: str = Query(..., description="Owner's email address")
):
    """Create a new email template"""
    try:
        appwrite = AppwriteService()
        now = datetime.now(timezone.utc).isoformat()
        
        doc_data = {
            "owner_email": owner_email,
            "name": data.name,
            "description": data.description or "",
            "content_json": data.content_json,
            "is_public": data.is_public,
            "created_at": now,
            "updated_at": now
        }
        
        if data.content_html:
            doc_data["content_html"] = data.content_html
        
        result = appwrite.create_document(
            TEMPLATES_COLLECTION,
            document_id=ID.unique(),
            data=doc_data
        )
        
        return TemplateResponse(
            id=result["$id"],
            owner_email=result["owner_email"],
            name=result["name"],
            description=result.get("description", ""),
            content_json=result["content_json"],
            content_html=result.get("content_html"),
            is_public=result.get("is_public", False),
            created_at=datetime.fromisoformat(result["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(result["updated_at"].replace("Z", "+00:00"))
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete an email template"""
    try:
        appwrite = AppwriteService()
        
        appwrite.delete_document(
            TEMPLATES_COLLECTION,
            template_id
        )
        
        return {"success": True, "message": "Template deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
