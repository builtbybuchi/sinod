"""
Payment API routes
"""

from fastapi import APIRouter, HTTPException, status
import logging

from models.payment_models import (
    InitiatePaymentRequest,
    InitiatePaymentResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse
)
from services.payment_service import payment_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/initiate", response_model=InitiatePaymentResponse)
async def initiate_payment(request: InitiatePaymentRequest):
    """
    Initiate payment with Squadco
    
    - **amount**: Amount in NGN
    - **email**: Customer email address
    - **currency**: Currency code (default: NGN)
    - **attendee_id**: Attendee document ID in Appwrite
    - **event_id**: Event page URL
    """
    try:
        result = await payment_service.initiate_payment(
            amount=request.amount,
            email=request.email,
            currency=request.currency,
            attendee_id=request.attendee_id,
            event_id=request.event_id
        )
        
        if result["success"]:
            return InitiatePaymentResponse(
                success=True,
                checkout_url=result.get("checkout_url"),
                transaction_ref=result.get("transaction_ref")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to initiate payment")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in initiate_payment endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(request: VerifyPaymentRequest):
    """
    Verify payment status with Squadco
    
    - **transaction_ref**: Transaction reference from Squadco
    - **attendee_id**: Attendee document ID (for reference)
    """
    try:
        result = await payment_service.verify_payment(
            transaction_ref=request.transaction_ref
        )
        
        if result["success"]:
            return VerifyPaymentResponse(
                success=True,
                paid=result.get("paid", False),
                transaction_status=result.get("transaction_status"),
                amount=result.get("amount")
            )
        else:
            # Return success=True but paid=False for better error handling
            return VerifyPaymentResponse(
                success=True,
                paid=False,
                error=result.get("error", "Payment verification failed")
            )
            
    except Exception as e:
        logger.error(f"Error in verify_payment endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def payment_health():
    """Check payment service health"""
    return {
        "service": "payment",
        "status": "healthy",
        "squadco_configured": payment_service.secret_key is not None
    }
