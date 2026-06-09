"""
Whiteboard invite email routes
"""

from fastapi import APIRouter, HTTPException, status
import logging

from models.whiteboard_models import WhiteboardInviteEmailRequest
from models.email_models import EmailResponse
from services.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/send-whiteboard-invite", response_model=EmailResponse)
async def send_whiteboard_invite(request: WhiteboardInviteEmailRequest):
    """
    Send whiteboard collaboration invite email
    
    - **to_email**: Recipient email address
    - **inviter_name**: Name of person inviting
    - **whiteboard_title**: Title of the whiteboard
    - **invite_token**: Unique token for the invite link
    """
    try:
        result = await email_service.send_whiteboard_invite_email(
            to_email=request.to_email,
            inviter_name=request.inviter_name,
            whiteboard_title=request.whiteboard_title,
            invite_token=request.invite_token
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
                detail=result.get("error", "Failed to send whiteboard invite email")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_whiteboard_invite endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def whiteboard_email_health():
    """Check whiteboard email service health"""
    return {
        "service": "whiteboard-email",
        "status": "healthy",
        "resend_configured": email_service.api_key is not None
    }
