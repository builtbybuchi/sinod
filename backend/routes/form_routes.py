"""
Forms API Routes
Handles form CRUD and form response submission/listing
"""

import json
import logging
from fastapi import APIRouter, HTTPException, Query as QueryParam
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime, timezone
from appwrite.query import Query
from appwrite.id import ID

from models.form_models import (
    FormCreate,
    FormUpdate,
    FormResponse,
    FormListResponse,
    FormSubmission,
    FormSubmissionResponse,
    FormSubmissionListResponse,
)
from services.appwrite_service import get_appwrite_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

FORMS_COLLECTION = settings.APPWRITE_FORMS_COLLECTION_ID
FORM_RESPONSES_COLLECTION = settings.APPWRITE_FORM_RESPONSES_COLLECTION_ID


# ============================================================================
# FORM CRUD
# ============================================================================

@router.post("/forms", response_model=FormResponse)
async def create_form(form: FormCreate):
    """Create a new form"""
    try:
        appwrite = get_appwrite_service()
        now = datetime.now(timezone.utc).isoformat()

        # Serialize questions list to JSON string
        questions_json = json.dumps([q.model_dump() for q in form.questions])

        data = {
            "title": form.title,
            "description": form.description or "",
            "questions": questions_json,
            "created_by": form.created_by,
            "status": form.status or "active",
            "is_public": form.is_public,
            "event_id": form.event_id or "",
            "response_count": 0,
            "created_at": now,
            "updated_at": now,
        }

        # Use page_url as document ID (short slug) if provided, else auto-generate
        document_id = (form.page_url or "").strip() or ID.unique()
        data["page_url"] = document_id

        result = appwrite.create_document(
            collection_id=FORMS_COLLECTION,
            data=data,
            document_id=document_id,
        )

        logger.info(f"Created form: {result['$id']} by {form.created_by}")
        return FormResponse(**result)

    except Exception as e:
        logger.error(f"Error creating form: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forms", response_model=FormListResponse)
async def list_forms(
    created_by: Optional[str] = QueryParam(None, description="Filter by creator email"),
    event_id: Optional[str] = QueryParam(None, description="Filter by event ID"),
    status: Optional[str] = QueryParam(None, description="Filter by status"),
    limit: int = QueryParam(50, ge=1, le=100),
    offset: int = QueryParam(0, ge=0),
):
    """List forms, optionally filtered by creator or event"""
    try:
        appwrite = get_appwrite_service()

        queries = [
            Query.order_desc("$createdAt"),
            Query.limit(limit),
            Query.offset(offset),
        ]

        if created_by:
            queries.append(Query.equal("created_by", created_by))
        if event_id:
            queries.append(Query.equal("event_id", event_id))
        if status:
            queries.append(Query.equal("status", status))

        result = appwrite.list_documents(
            collection_id=FORMS_COLLECTION,
            queries=queries,
        )

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Error listing forms: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forms/{form_id}")
async def get_form(form_id: str):
    """Get a single form by ID"""
    try:
        appwrite = get_appwrite_service()
        result = appwrite.get_document(
            collection_id=FORMS_COLLECTION,
            document_id=form_id,
        )
        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Error getting form {form_id}: {e}")
        if "could not be found" in str(e):
            raise HTTPException(status_code=404, detail="Form not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/forms/{form_id}", response_model=FormResponse)
async def update_form(
    form_id: str,
    form: FormUpdate,
    user_email: str = QueryParam(..., description="Owner email for authorization"),
):
    """Update a form (only the owner can update)"""
    try:
        appwrite = get_appwrite_service()

        # Verify ownership
        existing = appwrite.get_document(
            collection_id=FORMS_COLLECTION,
            document_id=form_id,
        )
        if existing.get("created_by") != user_email:
            raise HTTPException(status_code=403, detail="Only the form owner can update it")

        update_data = {}
        if form.title is not None:
            update_data["title"] = form.title
        if form.description is not None:
            update_data["description"] = form.description
        if form.questions is not None:
            update_data["questions"] = json.dumps([q.model_dump() for q in form.questions])
        if form.status is not None:
            update_data["status"] = form.status
        if form.is_public is not None:
            update_data["is_public"] = form.is_public

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = appwrite.update_document(
            collection_id=FORMS_COLLECTION,
            document_id=form_id,
            data=update_data,
        )

        logger.info(f"Updated form: {form_id}")
        return FormResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating form {form_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/forms/{form_id}")
async def delete_form(
    form_id: str,
    user_email: str = QueryParam(..., description="Owner email for authorization"),
):
    """Delete a form and all its responses"""
    try:
        appwrite = get_appwrite_service()

        # Verify ownership
        existing = appwrite.get_document(
            collection_id=FORMS_COLLECTION,
            document_id=form_id,
        )
        if existing.get("created_by") != user_email:
            raise HTTPException(status_code=403, detail="Only the form owner can delete it")

        # Delete all responses for this form
        try:
            responses = appwrite.list_documents(
                collection_id=FORM_RESPONSES_COLLECTION,
                queries=[Query.equal("form_id", form_id), Query.limit(500)],
            )
            for doc in responses.get("documents", []):
                appwrite.delete_document(
                    collection_id=FORM_RESPONSES_COLLECTION,
                    document_id=doc["$id"],
                )
        except Exception:
            pass  # Best effort cleanup

        # Delete the form
        appwrite.delete_document(
            collection_id=FORMS_COLLECTION,
            document_id=form_id,
        )

        logger.info(f"Deleted form: {form_id}")
        return {"message": "Form deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting form {form_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# FORM RESPONSES (SUBMISSIONS)
# ============================================================================

@router.post("/forms/{form_id}/responses", response_model=FormSubmissionResponse)
async def submit_form_response(form_id: str, submission: FormSubmission):
    """Submit a response to a form"""
    try:
        appwrite = get_appwrite_service()

        # Verify form exists and is active
        form = appwrite.get_document(
            collection_id=FORMS_COLLECTION,
            document_id=form_id,
        )
        if form.get("status") == "closed":
            raise HTTPException(status_code=400, detail="This form is no longer accepting responses")

        now = datetime.now(timezone.utc).isoformat()
        answers_json = json.dumps(submission.answers)

        data = {
            "form_id": form_id,
            "respondent_name": submission.respondent_name or "Anonymous",
            "answers": answers_json,
            "submitted_at": now,
        }

        # Only include respondent_email if provided (Appwrite email type rejects empty strings)
        if submission.respondent_email:
            data["respondent_email"] = submission.respondent_email

        result = appwrite.create_document(
            collection_id=FORM_RESPONSES_COLLECTION,
            data=data,
        )

        # Increment response count on the form
        try:
            current_count = form.get("response_count", 0) or 0
            appwrite.update_document(
                collection_id=FORMS_COLLECTION,
                document_id=form_id,
                data={"response_count": current_count + 1},
            )
        except Exception:
            pass  # Non-critical

        logger.info(f"Form response submitted for form {form_id}")
        return FormSubmissionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting form response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forms/{form_id}/responses")
async def list_form_responses(
    form_id: str,
    limit: int = QueryParam(100, ge=1, le=500),
    offset: int = QueryParam(0, ge=0),
):
    """List all responses for a form (form owner only — no auth enforced at API level yet)"""
    try:
        appwrite = get_appwrite_service()

        queries = [
            Query.equal("form_id", form_id),
            Query.order_desc("$createdAt"),
            Query.limit(limit),
            Query.offset(offset),
        ]

        result = appwrite.list_documents(
            collection_id=FORM_RESPONSES_COLLECTION,
            queries=queries,
        )

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Error listing form responses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forms/{form_id}/responses/{response_id}")
async def get_form_response(form_id: str, response_id: str):
    """Get a single form response"""
    try:
        appwrite = get_appwrite_service()
        result = appwrite.get_document(
            collection_id=FORM_RESPONSES_COLLECTION,
            document_id=response_id,
        )

        if result.get("form_id") != form_id:
            raise HTTPException(status_code=404, detail="Response not found for this form")

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting form response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/forms/{form_id}/responses/{response_id}")
async def delete_form_response(form_id: str, response_id: str):
    """Delete a single form response"""
    try:
        appwrite = get_appwrite_service()

        # Verify it belongs to the form
        result = appwrite.get_document(
            collection_id=FORM_RESPONSES_COLLECTION,
            document_id=response_id,
        )
        if result.get("form_id") != form_id:
            raise HTTPException(status_code=404, detail="Response not found for this form")

        appwrite.delete_document(
            collection_id=FORM_RESPONSES_COLLECTION,
            document_id=response_id,
        )

        # Decrement response count
        try:
            form = appwrite.get_document(collection_id=FORMS_COLLECTION, document_id=form_id)
            current_count = form.get("response_count", 0) or 0
            appwrite.update_document(
                collection_id=FORMS_COLLECTION,
                document_id=form_id,
                data={"response_count": max(0, current_count - 1)},
            )
        except Exception:
            pass

        return {"message": "Response deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting form response: {e}")
        raise HTTPException(status_code=500, detail=str(e))
