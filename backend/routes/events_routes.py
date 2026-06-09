"""
Events and Attendees API Routes
Handles all event and attendee management operations
"""

import logging
from fastapi import APIRouter, HTTPException, Query as QueryParam
from fastapi.responses import JSONResponse
from typing import List, Optional
import json
from datetime import datetime, timezone
from appwrite.query import Query
from appwrite.id import ID
from appwrite.services.tables_db import TablesDB


from models.events import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListResponse,
    AttendeeRegisterRequest,
    AttendeeRegister,
    AttendeeUpdate,
    AttendeeResponse,
    AttendeeListResponse,
    QRVerifyRequest,
    QRVerifyResponse,
    CheckInRequest,
    ExploreFilters
)
from services.appwrite_service import get_appwrite_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Collection IDs
EVENTS_COLLECTION = settings.APPWRITE_EVENTS_COLLECTION_ID
ATTENDEES_COLLECTION = settings.APPWRITE_ATTENDEES_COLLECTION_ID


def _unpack_meta(doc: dict) -> dict:
    """Unpack the consolidated `meta` JSON field back into top-level keys
    (custom_questions, ticket_types, coupons) so API responses keep the
    shape the frontend expects."""
    try:
        raw = doc.get("meta")
        if raw:
            stored = json.loads(raw)
            for k, v in stored.items():
                if k not in doc:
                    doc[k] = v
    except Exception:
        pass
    return doc


def _unpack_meta_list(result: dict) -> dict:
    """Unpack meta for every document in a list response."""
    for d in result.get("documents", []):
        _unpack_meta(d)
    return result


# ============================================================================
# EVENT ENDPOINTS
# ============================================================================

@router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate):
    """
    Create a new event
    """
    try:
        appwrite = get_appwrite_service()

        # Prepare event data - exclude None values to avoid sending unknown attributes
        event_data = event.model_dump(exclude_none=True)

        # Consolidate large JSON fields into a single `meta` attribute to avoid
        # hitting Appwrite's per-collection attribute limits. We'll pack
        # custom_questions, ticket_types and coupons into `meta` if provided.
        meta_keys = ["custom_questions", "ticket_types", "coupons"]
        meta = {}
        for k in meta_keys:
            if k in event_data:
                meta[k] = event_data.pop(k)
        if meta:
            event_data["meta"] = json.dumps(meta)

        # Note: All fields including theme, primary_color, font_family, logo_url,
        # allow_group_registration, max_group_size, fee_bearer, bg_color, text_color
        # are still expected by the frontend but we store large JSON blobs in
        # `meta` to avoid Appwrite attribute limits.

        # Use the event_page_url as the document ID (slug); fallback to generated
        document_id = (event.event_page_url or "").strip() or ID.unique()
        # Ensure the stored field matches the document ID/slug
        event_data["event_page_url"] = document_id

        # Create event in database with slug as ID
        result = appwrite.create_document(
            collection_id=EVENTS_COLLECTION,
            document_id=document_id,
            data=event_data
        )

        # If we stored data in `meta`, unpack it back into the returned
        # document so the API response keeps the legacy shape
        _unpack_meta(result)

        logger.info(f"Created event: {result['$id']} by {event.user_email}")
        return EventResponse(**result)

    except Exception as e:
        logger.error(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events", response_model=EventListResponse)
async def list_user_events(
    user_email: str = QueryParam(..., description="User's email address"),
    limit: int = QueryParam(50, ge=1, le=100),
    offset: int = QueryParam(0, ge=0)
):
    """
    List events created by a specific user
    """
    try:
        appwrite = get_appwrite_service()
        
        queries = [
            Query.equal('user_email', user_email),
            Query.order_desc('event_time'),
            Query.limit(limit),
            Query.offset(offset)
        ]
        
        result = appwrite.list_documents(
            collection_id=EVENTS_COLLECTION,
            queries=queries
        )

        _unpack_meta_list(result)

        return EventListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error listing events for {user_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/registered/user", response_model=EventListResponse)
async def list_registered_events(
    user_email: str = QueryParam(..., description="User's email address"),
    limit: int = QueryParam(50, ge=1, le=100),
    offset: int = QueryParam(0, ge=0)
):
    """
    List events that a user is registered for as an attendee
    """
    try:
        appwrite = get_appwrite_service()
        
        # Step 1: Get all attendee records for this user's email
        attendee_queries = [
            Query.equal('email', user_email),
            Query.limit(100)  # Get up to 100 registrations
        ]
        
        attendees_result = appwrite.list_documents(
            collection_id=ATTENDEES_COLLECTION,
            queries=attendee_queries
        )
        
        if not attendees_result['documents']:
            # User has no registrations
            return EventListResponse(documents=[], total=0)
        
        # Step 2: Extract unique event_id values (short IDs stored in event_id field)
        event_ids = list(set(
            doc['event_id'] for doc in attendees_result['documents'] 
            if doc.get('event_id')
        ))
        
        if not event_ids:
            return EventListResponse(documents=[], total=0)
        
        # Step 3: Fetch events by matching event_page_url field with event_id values
        # Note: event_id in attendees matches event_page_url in events
        event_queries = [
            Query.equal('event_page_url', event_ids),
            Query.order_desc('event_time')
        ]
        
        events_result = appwrite.list_documents(
            collection_id=EVENTS_COLLECTION,
            queries=event_queries
        )

        _unpack_meta_list(events_result)

        logger.info(f"Found {events_result['total']} registered events for {user_email}")
        return EventListResponse(**events_result)
        
    except Exception as e:
        logger.error(f"Error listing registered events for {user_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    """
    Get a single event by ID or event_page_url
    """
    try:
        appwrite = get_appwrite_service()
        
        # First, try to get by document ID
        try:
            result = appwrite.get_document(
                collection_id=EVENTS_COLLECTION,
                document_id=event_id
            )

            _unpack_meta(result)

            return EventResponse(**result)
        except Exception as doc_error:
            # If not found by ID, try querying by event_page_url
            if "Document with the requested ID could not be found" in str(doc_error):
                results = appwrite.list_documents(
                    collection_id=EVENTS_COLLECTION,
                    queries=[Query.equal('event_page_url', event_id), Query.limit(1)]
                )
                
                if results['total'] > 0:
                    doc = results['documents'][0]
                    _unpack_meta(doc)
                    return EventResponse(**doc)
                else:
                    raise HTTPException(status_code=404, detail="Event not found")
            raise doc_error
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, event: EventUpdate):
    """
    Update an existing event
    """
    try:
        appwrite = get_appwrite_service()
        
        # Only include fields that were provided
        update_data = event.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Pack large JSON fields into meta (same as create_event)
        meta_keys = ["custom_questions", "ticket_types", "coupons"]
        to_pack = {k: update_data.pop(k) for k in list(update_data.keys()) if k in meta_keys}
        if to_pack:
            # Merge with existing meta
            try:
                existing = appwrite.get_document(collection_id=EVENTS_COLLECTION, document_id=event_id)
                existing_meta = json.loads(existing.get("meta") or "{}") if existing.get("meta") else {}
            except Exception:
                existing_meta = {}
            existing_meta.update(to_pack)
            update_data["meta"] = json.dumps(existing_meta)
        
        result = appwrite.update_document(
            collection_id=EVENTS_COLLECTION,
            document_id=event_id,
            data=update_data
        )
        
        _unpack_meta(result)
        
        logger.info(f"Updated event: {event_id}")
        return EventResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event {event_id}: {e}")
        if "Document with the requested ID could not be found" in str(e):
            raise HTTPException(status_code=404, detail="Event not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    user_email: str = QueryParam(...),
    reason: str = QueryParam(None)
):
    """
    Delete an event (only by organizer)
    """
    try:
        appwrite = get_appwrite_service()
        
        # First verify the user is the organizer
        event = appwrite.get_document(
            collection_id=EVENTS_COLLECTION,
            document_id=event_id
        )
        
        if event.get('user_email') != user_email:
            raise HTTPException(
                status_code=403,
                detail="Only the event organizer can delete this event"
            )
        
        # Log reason (if provided) to contact-messages table for admin visibility
        try:
            if reason:
                appwrite.create_document(
                    collection_id="contact-messages",
                    data={
                        "name": event.get("user_email", "Organizer"),
                        "email": event.get("user_email", ""),
                        "subject": f"Delete event request: {event.get('event_name', event_id)}",
                        "message": reason,
                        "type": "delete_reason",
                        "event_id": event.get("event_page_url", event_id),
                        "reason": reason,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                )
        except Exception as log_err:
            logger.warning(f"Failed to log delete reason for event {event_id}: {log_err}")

        # Delete the event
        appwrite.delete_document(
            collection_id=EVENTS_COLLECTION,
            document_id=event_id
        )
        
        logger.info(f"Deleted event: {event_id} by {user_email}")
        return {"success": True, "message": "Event deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event {event_id}: {e}")
        if "Document with the requested ID could not be found" in str(e):
            raise HTTPException(status_code=404, detail="Event not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/explore/all", response_model=EventListResponse)
async def explore_events(filters: ExploreFilters = QueryParam()):
    """
    Get public events for explore page with filters
    """
    try:
        appwrite = get_appwrite_service()
        
        queries = [
            Query.equal('public_status', True),
            Query.order_desc('event_time'),
            Query.limit(filters.limit or 50),
            Query.offset(filters.offset or 0)
        ]
        
        # Apply filters
        if filters.city:
            queries.append(Query.equal('city', filters.city))
        
        if filters.isPaid is not None:
            queries.append(Query.equal('paid', filters.isPaid))
        
        if filters.isVirtual is not None:
            queries.append(Query.equal('virtual_status', filters.isVirtual))
        
        if filters.search:
            queries.append(Query.search('event_name', filters.search))
        
        result = appwrite.list_documents(
            collection_id=EVENTS_COLLECTION,
            queries=queries
        )
        
        _unpack_meta_list(result)
        
        return EventListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error exploring events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/explore/city/{city}", response_model=EventListResponse)
async def explore_events_by_city(
    city: str,
    limit: int = QueryParam(50, ge=1, le=100),
    offset: int = QueryParam(0, ge=0)
):
    """
    Get events for a specific city
    """
    try:
        appwrite = get_appwrite_service()
        
        queries = [
            Query.equal('city', city),
            Query.equal('public_status', True),
            Query.order_desc('event_time'),
            Query.limit(limit),
            Query.offset(offset)
        ]
        
        result = appwrite.list_documents(
            collection_id=EVENTS_COLLECTION,
            queries=queries
        )
        
        _unpack_meta_list(result)
        
        return EventListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting events for city {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ATTENDEE ENDPOINTS
# ============================================================================

@router.post("/events/{event_id}/attendees", response_model=AttendeeResponse)
async def register_attendee(event_id: str, attendee: AttendeeRegisterRequest):
    """
    Register an attendee for an event
    """
    try:
        appwrite = get_appwrite_service()
        
        # Prepare attendee data with event_id from URL path
        attendee_data = attendee.model_dump()
        attendee_data['event_id'] = event_id
        
        # Generate registration ID if not provided
        if not attendee_data.get('registration_id'):
            attendee_data['registration_id'] = f"REG-{ID.unique()}"
        
        # Note: custom_responses is now in the Appwrite collection schema.
        
        # Handle phone_number: Appwrite has it as integer, so strip non-digits
        # and convert, or remove entirely if empty/invalid (it's optional)
        phone_val = attendee_data.get('phone_number')
        if phone_val is not None:
            # Strip everything except digits (and leading +)
            digits_only = ''.join(c for c in str(phone_val) if c.isdigit())
            if digits_only:
                try:
                    attendee_data['phone_number'] = int(digits_only)
                except (ValueError, OverflowError):
                    attendee_data.pop('phone_number', None)
            else:
                # Empty or invalid phone — just remove it
                attendee_data.pop('phone_number', None)
        
        # Remove None values to avoid sending unknown attributes
        attendee_data = {k: v for k, v in attendee_data.items() if v is not None}
        
        # Create attendee
        result = appwrite.create_document(
            collection_id=ATTENDEES_COLLECTION,
            data=attendee_data
        )
        
        logger.info(f"Registered attendee {attendee.email} for event {event_id}")
        return AttendeeResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering attendee: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/{event_id}/attendees")
async def list_event_attendees(
    event_id: str,
    limit: int = QueryParam(100, ge=1, le=500),
    offset: int = QueryParam(0, ge=0)
):
    """
    List all attendees for an event
    Returns raw Appwrite documents to preserve field names like $id and $createdAt
    """
    try:
        appwrite = get_appwrite_service()
        
        queries = [
            Query.equal('event_id', event_id),
            Query.order_desc('$createdAt'),
            Query.limit(limit),
            Query.offset(offset)
        ]
        
        result = appwrite.list_documents(
            collection_id=ATTENDEES_COLLECTION,
            queries=queries
        )
        
        # Return raw Appwrite response to preserve $id and $createdAt fields
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Error listing attendees for event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/{event_id}/attendees/{attendee_id}", response_model=AttendeeResponse)
async def get_attendee(event_id: str, attendee_id: str):
    """
    Get a specific attendee
    """
    try:
        appwrite = get_appwrite_service()
        
        result = appwrite.get_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id
        )
        
        # Verify attendee belongs to the event
        if result.get('event_id') != event_id:
            raise HTTPException(
                status_code=404,
                detail="Attendee not found for this event"
            )
        
        return AttendeeResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting attendee {attendee_id}: {e}")
        if "Document with the requested ID could not be found" in str(e):
            raise HTTPException(status_code=404, detail="Attendee not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/events/{event_id}/attendees/{attendee_id}", response_model=AttendeeResponse)
async def update_attendee(event_id: str, attendee_id: str, attendee: AttendeeUpdate):
    """
    Update an attendee's information
    """
    try:
        appwrite = get_appwrite_service()
        
        # Verify attendee exists and belongs to event
        existing = appwrite.get_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id
        )
        
        if existing.get('event_id') != event_id:
            raise HTTPException(
                status_code=404,
                detail="Attendee not found for this event"
            )
        
        # Only include fields that were provided
        update_data = attendee.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        result = appwrite.update_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id,
            data=update_data
        )
        
        logger.info(f"Updated attendee: {attendee_id}")
        return AttendeeResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating attendee {attendee_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/events/{event_id}/attendees/{attendee_id}")
async def delete_attendee(event_id: str, attendee_id: str):
    """
    Delete an attendee registration
    """
    try:
        appwrite = get_appwrite_service()
        
        # Verify attendee exists and belongs to event
        attendee = appwrite.get_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id
        )
        
        if attendee.get('event_id') != event_id:
            raise HTTPException(
                status_code=404,
                detail="Attendee not found for this event"
            )
        
        # Delete attendee
        appwrite.delete_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id
        )
        
        logger.info(f"Deleted attendee: {attendee_id}")
        return {"success": True, "message": "Attendee deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting attendee {attendee_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events/{event_id}/attendees/verify", response_model=AttendeeResponse)
async def verify_attendee(event_id: str, attendee_id: str = QueryParam(...)):
    """
    Verify an attendee (mark as verified)
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get attendee
        attendee = appwrite.get_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id
        )
        
        # Verify attendee belongs to event
        if attendee.get('event_id') != event_id:
            raise HTTPException(
                status_code=404,
                detail="Attendee not found for this event"
            )
        
        # Mark as verified
        result = appwrite.update_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id,
            data={
                'verified': True,
                'verified_at': datetime.now(timezone.utc).isoformat()
            }
        )
        
        logger.info(f"Verified attendee: {attendee_id}")
        return AttendeeResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying attendee: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events/{event_id}/attendees/{attendee_id}/approve", response_model=AttendeeResponse)
async def approve_attendee(
    event_id: str, 
    attendee_id: str, 
    user_email: str = QueryParam(...),
    custom_message: str = QueryParam(None)
):
    """
    Approve an attendee registration (event host only)
    Optional custom_message will be included in the approval email
    Note: event_id can be either the document ID or the event_page_url
    """
    try:
        appwrite = get_appwrite_service()
        
        # Try to get event - first check if it's a document ID, otherwise query by event_page_url
        try:
            event = appwrite.get_document(
                collection_id=EVENTS_COLLECTION,
                document_id=event_id
            )
        except:
            # Not a valid document ID, try querying by event_page_url
            from appwrite.query import Query
            result = appwrite.list_documents(
                collection_id=EVENTS_COLLECTION,
                queries=[
                    Query.equal('event_page_url', event_id)
                ]
            )
            if not result.get('documents'):
                raise HTTPException(status_code=404, detail="Event not found")
            event = result['documents'][0]
            # Use the actual event document ID for further operations
            actual_event_id = event['$id']
        
        if event.get('user_email') != user_email:
            raise HTTPException(
                status_code=403,
                detail="Only the event host can approve attendees"
            )
        
        # Get attendee
        attendee = appwrite.get_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id
        )
        
        # Verify attendee belongs to event (use actual event ID if we looked it up)
        attendee_event_id = attendee.get('event_id')
        if attendee_event_id != event.get('$id') and attendee_event_id != event_id:
            raise HTTPException(
                status_code=404,
                detail="Attendee not found for this event"
            )
        
        # Mark as approved
        result = appwrite.update_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id,
            data={
                'approved': True,
                'approved_at': datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Send approval email with event details
        from services.email_service import send_approval_email
        try:
            # Get attendee name - handle both formats
            attendee_name = attendee.get('name') or f"{attendee.get('first_name', '')} {attendee.get('last_name', '')}".strip()
            
            await send_approval_email(
                to_email=attendee.get('email'),
                attendee_name=attendee_name,
                event_title=event.get('event_name') or event.get('title'),
                event_date=event.get('event_time'),  # Using event_time as it contains date info
                event_time=event.get('event_time'),
                event_location=event.get('event_address') or event.get('location') or '',
                registration_id=attendee.get('registration_id'),
                qr_code_url=attendee.get('qr_code_url'),
                custom_message=custom_message
            )
        except Exception as email_error:
            logger.error(f"Failed to send approval email: {email_error}")
            # Don't fail the approval if email fails
        
        logger.info(f"Approved attendee: {attendee_id} by {user_email}")
        return AttendeeResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving attendee: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events/verify-qr", response_model=QRVerifyResponse)
async def verify_attendee_qr(request: QRVerifyRequest):
    """
    Verify attendee via QR code (registration_id)
    """
    try:
        appwrite = get_appwrite_service()
        
        # 1. Look for attendee by registration_id
        attendees = appwrite.list_documents(
            collection_id=ATTENDEES_COLLECTION,
            queries=[
                Query.equal('registration_id', request.qrCode),
                Query.limit(1)
            ]
        )
        
        if attendees['total'] == 0:
            return QRVerifyResponse(
                valid=False,
                message="Invalid QR Code: Attendee not found",
                attendee=None
            )
            
        attendee_doc = attendees['documents'][0]
        attendee_id = attendee_doc['$id']
        
        # 2. Check if attendee belongs to the event
        # Note: events usually use event_page_url as ID in frontend context, 
        # but stored as event_id in attendee.
        # Check against both ID and page URL to be safe, or assume strict match
        if attendee_doc.get('event_id') != request.eventId:
             return QRVerifyResponse(
                valid=False,
                message="Invalid QR Code: Attendee registered for a different event",
                attendee=None
            )
            
        # 3. Check approved status
        if not attendee_doc.get('approved', False):
            # We still convert to AttendeeResponse for the frontend to show who it is
            return QRVerifyResponse(
                valid=False,
                message=f"{attendee_doc.get('first_name')} is not approved for this event",
                attendee=AttendeeResponse(**attendee_doc)
            )
            
        # 4. Check if already verified
        if attendee_doc.get('verified', False):
            return QRVerifyResponse(
                valid=False,
                message=f"{attendee_doc.get('first_name')} has already been verified",
                attendee=AttendeeResponse(**attendee_doc)
            )
            
        # 5. Verify the attendee
        updated_doc = appwrite.update_document(
            collection_id=ATTENDEES_COLLECTION,
            document_id=attendee_id,
            data={
                'verified': True,
                'verified_at': datetime.now(timezone.utc).isoformat()
            }
        )
        
        logger.info(f"Verified attendee by QR: {attendee_id}")
        
        return QRVerifyResponse(
            valid=True,
            message=f"✓ {attendee_doc.get('first_name')} successfully verified!",
            attendee=AttendeeResponse(**updated_doc)
        )
        
    except Exception as e:
        logger.error(f"Error verifying QR code: {e}")
        return QRVerifyResponse(
            valid=False,
            message=f"System error: {str(e)}",
            attendee=None
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "events"}


# ============================================================================
# CUSTOM QUESTION RESPONSES
# ============================================================================

@router.get("/events/{event_id}/custom-responses")
async def list_custom_responses(
    event_id: str,
    limit: int = QueryParam(100, ge=1, le=500),
    offset: int = QueryParam(0, ge=0),
):
    """
    List attendees with their custom question responses for an event.
    Used in the analytics tab to view responses to custom registration questions.
    """
    try:
        appwrite = get_appwrite_service()

        # Get the event to return its custom_questions definition
        event = appwrite.get_document(
            collection_id=EVENTS_COLLECTION,
            document_id=event_id,
        )

        questions = event.get("custom_questions", None)

        # Get attendees for this event
        queries = [
            Query.equal("event_id", event_id),
            Query.order_desc("$createdAt"),
            Query.limit(limit),
            Query.offset(offset),
        ]

        attendees_result = appwrite.list_documents(
            collection_id=ATTENDEES_COLLECTION,
            queries=queries,
        )

        return JSONResponse(content={
            "custom_questions": questions,
            "attendees": attendees_result.get("documents", []),
            "total": attendees_result.get("total", 0),
        })

    except Exception as e:
        logger.error(f"Error listing custom responses for event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
