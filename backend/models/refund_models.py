"""
Refund-related Pydantic models
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum


class RefundStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    FAILED = "failed"


class RefundRequest(BaseModel):
    """Request model for initiating a refund"""
    attendee_email: EmailStr = Field(..., description="Email of the attendee requesting refund")
    event_id: str = Field(..., description="Event page URL / event ID")
    reason: str = Field(default="", description="Reason for refund request")

    class Config:
        json_schema_extra = {
            "example": {
                "attendee_email": "attendee@example.com",
                "event_id": "jqt-wm4-cdd",
                "reason": "Cannot attend due to schedule conflict"
            }
        }


class RefundResponse(BaseModel):
    """Response model for refund operations"""
    success: bool
    message: str
    refund_id: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[float] = None
    error: Optional[str] = None


class AdminRefundAction(BaseModel):
    """Request model for admin to approve/reject a refund"""
    refund_id: str = Field(..., description="Refund document ID")
    action: str = Field(..., description="'approve' or 'reject'")
    admin_email: EmailStr = Field(..., description="Admin email performing the action")
    admin_note: str = Field(default="", description="Optional admin note")

    class Config:
        json_schema_extra = {
            "example": {
                "refund_id": "68e7abc123def",
                "action": "approve",
                "admin_email": "admin@sinod.com",
                "admin_note": "Approved - event not yet started"
            }
        }


class RefundListResponse(BaseModel):
    """Response model for listing refunds"""
    success: bool
    refunds: List[dict] = []
    total: int = 0
