"""
Newsletter API routes - Subscribe, Unsubscribe, and Feedback
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from typing import Optional
import logging

from services.appwrite_service import get_appwrite_service
from appwrite.query import Query

logger = logging.getLogger(__name__)

router = APIRouter()

NEWSLETTER_COLLECTION = "newsletter-subscribers"
UNSUBSCRIBE_FEEDBACK_COLLECTION = "unsubscribe-feedback"


# Request/Response Models
class SubscribeRequest(BaseModel):
    first_name: str
    last_name: Optional[str] = ""
    email: EmailStr


class SubscribeResponse(BaseModel):
    success: bool
    message: str
    is_resubscribe: bool = False


class UnsubscribeRequest(BaseModel):
    email: EmailStr


class UnsubscribeFeedbackRequest(BaseModel):
    email: EmailStr
    reason: str
    details: Optional[str] = ""


class UnsubscribeResponse(BaseModel):
    success: bool
    message: str


@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe_to_newsletter(request: SubscribeRequest):
    """
    Subscribe to the newsletter.
    If user already exists but is unsubscribed, re-subscribe them.
    """
    try:
        appwrite = get_appwrite_service()
        
        # Check if email already exists
        result = appwrite.list_documents(
            collection_id=NEWSLETTER_COLLECTION,
            queries=[Query.equal("email", request.email)]
        )
        
        documents = result.get('documents', [])
        
        if documents:
            # User exists - check subscription status
            existing = documents[0]
            if existing.get('subscribed', False):
                # Already subscribed
                return SubscribeResponse(
                    success=True,
                    message="You're already subscribed to our newsletter!",
                    is_resubscribe=False
                )
            else:
                # Re-subscribe the user
                appwrite.update_document(
                    collection_id=NEWSLETTER_COLLECTION,
                    document_id=existing['$id'],
                    data={
                        "subscribed": True,
                        "first_name": request.first_name,
                        "last_name": request.last_name or "",
                        "subscribed_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
                logger.info(f"User {request.email} re-subscribed to newsletter")
                return SubscribeResponse(
                    success=True,
                    message="Welcome back! We're so happy to see you join us again! 🎉",
                    is_resubscribe=True
                )
        else:
            # New subscriber
            appwrite.create_document(
                collection_id=NEWSLETTER_COLLECTION,
                data={
                    "first_name": request.first_name,
                    "last_name": request.last_name or "",
                    "email": request.email,
                    "subscribed": True,
                    "subscribed_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            logger.info(f"New newsletter subscription: {request.email}")
            return SubscribeResponse(
                success=True,
                message="Welcome to the Sinod' family! You'll receive our latest updates soon.",
                is_resubscribe=False
            )
            
    except Exception as e:
        logger.error(f"Error subscribing {request.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/unsubscribe/feedback", response_model=UnsubscribeResponse)
async def submit_unsubscribe_feedback(request: UnsubscribeFeedbackRequest):
    """
    Submit feedback about why the user is unsubscribing.
    This saves the feedback but does NOT unsubscribe the user yet.
    """
    try:
        appwrite = get_appwrite_service()
        
        # Save the feedback
        appwrite.create_document(
            collection_id=UNSUBSCRIBE_FEEDBACK_COLLECTION,
            data={
                "email": request.email,
                "reason": request.reason,
                "details": request.details or "",
                "submitted_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        
        logger.info(f"Unsubscribe feedback received from {request.email}: {request.reason}")
        return UnsubscribeResponse(
            success=True,
            message="Thank you for your feedback. We appreciate your honesty."
        )
        
    except Exception as e:
        logger.error(f"Error saving unsubscribe feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/unsubscribe/confirm", response_model=UnsubscribeResponse)
async def confirm_unsubscribe(request: UnsubscribeRequest):
    """
    Confirm and process the unsubscription.
    Sets subscribed=False but keeps the record for potential re-subscription.
    """
    try:
        appwrite = get_appwrite_service()
        
        # Find the subscriber
        result = appwrite.list_documents(
            collection_id=NEWSLETTER_COLLECTION,
            queries=[Query.equal("email", request.email)]
        )
        
        documents = result.get('documents', [])
        
        if not documents:
            return UnsubscribeResponse(
                success=False,
                message="Email not found in our newsletter list."
            )
        
        subscriber = documents[0]
        
        if not subscriber.get('subscribed', False):
            return UnsubscribeResponse(
                success=True,
                message="You're already unsubscribed from our newsletter."
            )
        
        # Update subscription status
        appwrite.update_document(
            collection_id=NEWSLETTER_COLLECTION,
            document_id=subscriber['$id'],
            data={
                "subscribed": False,
                "unsubscribed_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        
        logger.info(f"User {request.email} unsubscribed from newsletter")
        return UnsubscribeResponse(
            success=True,
            message="You've been unsubscribed. We're sad to see you go 😢 You can always subscribe back anytime!"
        )
        
    except Exception as e:
        logger.error(f"Error unsubscribing {request.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/status/{email}")
async def get_subscription_status(email: str):
    """
    Check if an email is subscribed to the newsletter.
    """
    try:
        appwrite = get_appwrite_service()
        
        result = appwrite.list_documents(
            collection_id=NEWSLETTER_COLLECTION,
            queries=[Query.equal("email", email)]
        )
        
        documents = result.get('documents', [])
        
        if not documents:
            return {
                "exists": False,
                "subscribed": False
            }
        
        subscriber = documents[0]
        return {
            "exists": True,
            "subscribed": subscriber.get('subscribed', False),
            "first_name": subscriber.get('first_name', ''),
            "subscribed_at": subscriber.get('subscribed_at'),
        }
        
    except Exception as e:
        logger.error(f"Error checking subscription status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
