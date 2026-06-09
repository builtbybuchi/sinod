"""
Email-related Pydantic models
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SendEmailRequest(BaseModel):
    """Request model for sending registration confirmation email"""
    to_email: EmailStr = Field(..., description="Recipient email address")
    attendee_name: str = Field(..., description="Attendee's full name")
    event_name: str = Field(..., description="Event name")
    event_time: str = Field(..., description="Event date and time")
    event_location: str = Field(..., description="Event location")
    registration_id: str = Field(..., description="Unique registration ID for QR code")
    event_page_url: str = Field(..., description="Event page URL slug")
    price_paid: Optional[float] = Field(None, description="Price paid in NGN (null for free events)")
    is_paid_event: bool = Field(default=False, description="Whether this is a paid event")
    
    class Config:
        json_schema_extra = {
            "example": {
                "to_email": "user@example.com",
                "attendee_name": "John Doe",
                "event_name": "Tech Conference 2024",
                "event_time": "2024-03-15 10:00 AM",
                "event_location": "Lagos Convention Center",
                "registration_id": "REG-ABC123XYZ",
                "event_page_url": "jqt-wm4-cdd",
                "price_paid": 5000.00,
                "is_paid_event": True
            }
        }


class WelcomeEmailRequest(BaseModel):
    """Request model for sending welcome email to new users"""
    to_email: EmailStr = Field(..., description="New user's email address")
    user_name: str = Field(..., description="User's full name")
    
    class Config:
        json_schema_extra = {
            "example": {
                "to_email": "newuser@example.com",
                "user_name": "Jane Smith"
            }
        }


class ApprovalEmailRequest(BaseModel):
    """Request model for sending approval email"""
    to_email: EmailStr = Field(..., description="Attendee email address")
    attendee_name: str = Field(..., description="Attendee's full name")
    event_name: str = Field(..., description="Event name")
    event_time: str = Field(..., description="Event date and time")
    event_location: str = Field(..., description="Event location")
    registration_id: str = Field(..., description="Unique registration ID for QR code")
    event_page_url: str = Field(..., description="Event page URL slug")
    
    class Config:
        json_schema_extra = {
            "example": {
                "to_email": "user@example.com",
                "attendee_name": "John Doe",
                "event_name": "Tech Conference 2024",
                "event_time": "2024-03-15 10:00 AM",
                "event_location": "Lagos Convention Center",
                "registration_id": "REG-ABC123XYZ",
                "event_page_url": "jqt-wm4-cdd"
            }
        }


class EmailResponse(BaseModel):
    """Response model for email operations"""
    success: bool
    message: str
    email_id: Optional[str] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Email sent successfully",
                "email_id": "re_abc123xyz"
            }
        }
