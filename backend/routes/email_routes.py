"""
Email API routes
"""

from fastapi import APIRouter, HTTPException, status
import logging

from models.email_models import SendEmailRequest, EmailResponse, WelcomeEmailRequest, ApprovalEmailRequest
from services.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/send-registration", response_model=EmailResponse)
async def send_registration_email(request: SendEmailRequest):
    """
    Send registration confirmation email with QR code
    
    - **to_email**: Recipient email address
    - **attendee_name**: Full name of the attendee
    - **event_name**: Name of the event
    - **event_time**: Date and time of the event
    - **event_location**: Event location
    - **registration_id**: Unique registration ID for QR code
    - **event_page_url**: Event page URL slug
    - **price_paid**: Amount paid in NGN (optional, for paid events)
    - **is_paid_event**: Whether this is a paid event
    """
    try:
        result = await email_service.send_registration_email(
            to_email=request.to_email,
            attendee_name=request.attendee_name,
            event_name=request.event_name,
            event_time=request.event_time,
            event_location=request.event_location,
            registration_id=request.registration_id,
            event_page_url=request.event_page_url,
            price_paid=request.price_paid,
            is_paid_event=request.is_paid_event
        )
        
        if result["success"]:
            return EmailResponse(
                success=True,
                message=result["message"],
                email_id=result.get("email_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to send email")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_registration_email endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/send-welcome", response_model=EmailResponse)
async def send_welcome_email(request: WelcomeEmailRequest):
    """
    Send welcome email to new users
    
    - **to_email**: New user's email address
    - **user_name**: User's full name
    """
    try:
        result = await email_service.send_welcome_email(
            to_email=request.to_email,
            user_name=request.user_name
        )
        
        if result["success"]:
            return EmailResponse(
                success=True,
                message=result["message"],
                email_id=result.get("email_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to send welcome email")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_welcome_email endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/send-approval", response_model=EmailResponse)
async def send_approval_email(request: ApprovalEmailRequest):
    """
    Send approval email to attendee with QR code
    
    - **to_email**: Attendee email address
    - **attendee_name**: Full name of the attendee
    - **event_name**: Name of the event
    - **event_time**: Date and time of the event
    - **event_location**: Event location
    - **registration_id**: Unique registration ID for QR code
    - **event_page_url**: Event page URL slug
    """
    try:
        result = await email_service.send_approval_email(
            to_email=request.to_email,
            attendee_name=request.attendee_name,
            event_name=request.event_name,
            event_time=request.event_time,
            event_location=request.event_location,
            registration_id=request.registration_id,
            event_page_url=request.event_page_url
        )
        
        if result["success"]:
            return EmailResponse(
                success=True,
                message=result["message"],
                email_id=result.get("email_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to send approval email")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_approval_email endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/send-rejection", response_model=EmailResponse)
async def send_rejection_email(request: dict):
    """
    Send rejection email to attendee when registration is not approved
    
    - **to_email**: Attendee email address
    - **attendee_name**: Full name of the attendee
    - **event_name**: Name of the event
    - **rejection_reason**: Optional reason for rejection
    """
    try:
        result = await email_service.send_rejection_email(
            to_email=request.get("to_email"),
            attendee_name=request.get("attendee_name"),
            event_name=request.get("event_name"),
            rejection_reason=request.get("rejection_reason")
        )
        
        if result["success"]:
            return EmailResponse(
                success=True,
                message=result["message"],
                email_id=result.get("email_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to send rejection email")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_rejection_email endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def email_health():
    """Check email service health"""
    return {
        "service": "email",
        "status": "healthy",
        "resend_configured": email_service.api_key is not None
    }
