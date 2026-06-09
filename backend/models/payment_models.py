"""
Payment-related Pydantic models
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class InitiatePaymentRequest(BaseModel):
    """Request model for initiating payment"""
    amount: float = Field(..., description="Amount in NGN")
    email: EmailStr = Field(..., description="Customer email")
    currency: str = Field(default="NGN", description="Currency code")
    attendee_id: str = Field(..., description="Attendee document ID")
    event_id: str = Field(..., description="Event page URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "amount": 5000.00,
                "email": "user@example.com",
                "currency": "NGN",
                "attendee_id": "68e7abc123def",
                "event_id": "jqt-wm4-cdd"
            }
        }


class InitiatePaymentResponse(BaseModel):
    """Response model for payment initiation"""
    success: bool
    checkout_url: Optional[str] = None
    transaction_ref: Optional[str] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "checkout_url": "https://pay.squadco.com/abc123",
                "transaction_ref": "SQCO_TXN_ABC123"
            }
        }


class VerifyPaymentRequest(BaseModel):
    """Request model for verifying payment"""
    transaction_ref: str = Field(..., description="Transaction reference from Squadco")
    attendee_id: str = Field(..., description="Attendee document ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "transaction_ref": "SQCO_TXN_ABC123",
                "attendee_id": "68e7abc123def"
            }
        }


class VerifyPaymentResponse(BaseModel):
    """Response model for payment verification"""
    success: bool
    paid: bool = False
    transaction_status: Optional[str] = None
    amount: Optional[float] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "paid": True,
                "transaction_status": "success",
                "amount": 5000.00
            }
        }
