"""
Refund API routes
"""

from fastapi import APIRouter, HTTPException, status, Query as QueryParam
from typing import Optional
import logging

from models.refund_models import RefundRequest, RefundResponse, AdminRefundAction, RefundListResponse
from services.refund_service import refund_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/request", response_model=RefundResponse)
async def request_refund(request: RefundRequest):
    """
    Request a refund for an event registration.
    
    - Auto-approved if > 48 hours before event
    - Requires admin approval if 24-48 hours before event  
    - Rejected if < 24 hours before event
    """
    try:
        result = await refund_service.request_refund(
            attendee_email=request.attendee_email,
            event_id=request.event_id,
            reason=request.reason
        )

        if result.get("success"):
            return RefundResponse(
                success=True,
                message=result.get("message", "Refund request processed"),
                refund_id=result.get("refund_id"),
                status=result.get("status"),
                amount=result.get("amount")
            )
        else:
            return RefundResponse(
                success=False,
                message=result.get("error", "Failed to process refund request"),
                error=result.get("error")
            )

    except Exception as e:
        logger.error(f"Error in request_refund endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/admin/action", response_model=RefundResponse)
async def admin_refund_action(request: AdminRefundAction):
    """
    Admin approve or reject a refund request
    
    - **refund_id**: The refund document ID
    - **action**: 'approve' or 'reject'
    - **admin_email**: Admin performing the action
    - **admin_note**: Optional note
    """
    try:
        result = await refund_service.admin_action(
            refund_id=request.refund_id,
            action=request.action,
            admin_email=request.admin_email,
            admin_note=request.admin_note
        )

        if result.get("success"):
            return RefundResponse(
                success=True,
                message=result.get("message", "Action completed"),
                refund_id=result.get("refund_id"),
                status=result.get("status"),
                amount=result.get("amount")
            )
        else:
            return RefundResponse(
                success=False,
                message=result.get("error", "Failed to process action"),
                error=result.get("error")
            )

    except Exception as e:
        logger.error(f"Error in admin_refund_action endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/list")
async def list_refunds(
    event_id: Optional[str] = QueryParam(None, description="Filter by event ID"),
    attendee_email: Optional[str] = QueryParam(None, description="Filter by attendee email"),
    host_email: Optional[str] = QueryParam(None, description="Filter by event host email"),
    status_filter: Optional[str] = QueryParam(None, alias="status", description="Filter by status: pending, approved, rejected, completed"),
    limit: int = QueryParam(50, ge=1, le=100),
    offset: int = QueryParam(0, ge=0)
):
    """
    List refund requests with optional filters.
    Can be used by attendees, event hosts, or admins.
    """
    try:
        result = await refund_service.list_refunds(
            event_id=event_id,
            attendee_email=attendee_email,
            host_email=host_email,
            status_filter=status_filter,
            limit=limit,
            offset=offset
        )

        if result.get("success"):
            return result
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to list refunds")
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in list_refunds endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/status")
async def check_refund_status(
    attendee_email: str = QueryParam(..., description="Attendee email"),
    event_id: str = QueryParam(..., description="Event ID")
):
    """
    Check if there's a refund request for a specific attendee + event
    """
    try:
        result = await refund_service.get_refund_status(
            attendee_email=attendee_email,
            event_id=event_id
        )

        if result.get("success"):
            return result
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to check refund status")
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in check_refund_status endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
