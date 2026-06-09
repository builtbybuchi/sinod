"""
Pydantic Models for Events and Attendees API
"""

from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


# ============================================================================
# EVENT MODELS
# ============================================================================

class EventCreate(BaseModel):
    """Model for creating a new event"""
    event_name: str = Field(..., min_length=1, max_length=200)
    event_description: Optional[str] = None
    event_address: Optional[str] = None
    event_time: str  # ISO format datetime string
    event_end_time: str  # ISO format datetime string
    user_email: EmailStr
    virtual_status: bool = False
    public_status: bool = True
    paid: bool = False
    event_price: Optional[int] = None  # Price in kobo
    event_url: Optional[str] = None
    city: Optional[str] = None
    event_page_url: Optional[str] = None
    auto_approve: bool = True
    has_custom_questions: bool = False
    custom_questions: Optional[str] = None  # JSON string of custom questions
    # Theme & customization
    theme: Optional[str] = None
    primary_color: Optional[str] = None
    font_family: Optional[str] = None
    logo_url: Optional[str] = None
    bg_color: Optional[str] = None
    text_color: Optional[str] = None
    ticket_types: Optional[str] = None  # JSON string of ticket types
    allow_group_registration: Optional[bool] = None
    max_group_size: Optional[int] = None
    coupons: Optional[str] = None  # JSON string of coupons
    fee_bearer: Optional[str] = None  # 'host' or 'attendee' — who pays the transaction fees


class EventUpdate(BaseModel):
    """Model for updating an event"""
    event_name: Optional[str] = Field(None, min_length=1, max_length=200)
    event_description: Optional[str] = None
    event_address: Optional[str] = None
    event_time: Optional[str] = None
    event_end_time: Optional[str] = None
    virtual_status: Optional[bool] = None
    public_status: Optional[bool] = None
    paid: Optional[bool] = None
    event_price: Optional[int] = None
    event_url: Optional[str] = None
    city: Optional[str] = None
    has_custom_questions: Optional[bool] = None
    custom_questions: Optional[str] = None  # JSON string of custom questions
    # Theme & customization
    theme: Optional[str] = None
    primary_color: Optional[str] = None
    font_family: Optional[str] = None
    logo_url: Optional[str] = None
    bg_color: Optional[str] = None
    text_color: Optional[str] = None
    ticket_types: Optional[str] = None
    allow_group_registration: Optional[bool] = None
    max_group_size: Optional[int] = None
    coupons: Optional[str] = None
    fee_bearer: Optional[str] = None  # 'host' or 'attendee'


class EventResponse(BaseModel):
    """Model for event response"""
    id: str = Field(alias="$id")
    event_name: str
    event_description: Optional[str] = None
    event_address: Optional[str] = None
    event_time: str
    event_end_time: Optional[str] = None
    user_email: str
    virtual_status: bool
    public_status: bool
    paid: bool
    event_price: Optional[int] = None
    event_url: Optional[str] = None
    city: Optional[str] = None
    event_page_url: Optional[str] = None
    auto_approve: Optional[bool] = True
    has_custom_questions: Optional[bool] = False
    custom_questions: Optional[str] = None  # JSON string of custom questions
    # Theme & customization
    theme: Optional[str] = None
    primary_color: Optional[str] = None
    font_family: Optional[str] = None
    logo_url: Optional[str] = None
    bg_color: Optional[str] = None
    text_color: Optional[str] = None
    ticket_types: Optional[str] = None
    allow_group_registration: Optional[bool] = None
    max_group_size: Optional[int] = None
    coupons: Optional[str] = None
    fee_bearer: Optional[str] = None  # 'host' or 'attendee'
    meta: Optional[str] = None  # Consolidated JSON for large fields
    
    class Config:
        populate_by_name = True
        extra = 'ignore'


class EventListResponse(BaseModel):
    """Model for list of events"""
    documents: List[EventResponse]
    total: int


# ============================================================================
# ATTENDEE MODELS
# ============================================================================

class AttendeeRegisterRequest(BaseModel):
    """Model for attendee registration request (without event_id, comes from URL)"""
    first_name: str = Field(..., min_length=1, max_length=255)
    last_name: str = Field(..., min_length=1, max_length=255)
    other_names: Optional[str] = Field(None, max_length=255)
    email: EmailStr
    phone_number: Optional[str] = None
    paid: bool = False
    approved: bool = False
    verified: bool = False
    registration_id: Optional[str] = Field(None, max_length=255)
    custom_responses: Optional[str] = None  # JSON string of custom question responses
    ticket_type_id: Optional[str] = Field(None, max_length=255)
    ticket_name: Optional[str] = Field(None, max_length=255)
    amount_paid: Optional[float] = None
    coupon_code: Optional[str] = Field(None, max_length=100)
    coupon_discount: Optional[float] = None


class AttendeeRegister(BaseModel):
    """Model for registering an attendee (internal use with event_id)"""
    event_id: str
    first_name: str = Field(..., min_length=1, max_length=255)
    last_name: str = Field(..., min_length=1, max_length=255)
    other_names: Optional[str] = Field(None, max_length=255)
    email: EmailStr
    phone_number: Optional[str] = None
    paid: bool = False
    approved: bool = False
    verified: bool = False
    registration_id: Optional[str] = Field(None, max_length=255)
    custom_responses: Optional[str] = None  # JSON string of custom question responses
    ticket_type_id: Optional[str] = Field(None, max_length=255)
    ticket_name: Optional[str] = Field(None, max_length=255)
    amount_paid: Optional[float] = None
    coupon_code: Optional[str] = Field(None, max_length=100)
    coupon_discount: Optional[float] = None


class AttendeeUpdate(BaseModel):
    """Model for updating an attendee"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=255)
    last_name: Optional[str] = Field(None, min_length=1, max_length=255)
    other_names: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    paid: Optional[bool] = None
    approved: Optional[bool] = None
    verified: Optional[bool] = None
    verified_at: Optional[str] = None
    approved_at: Optional[str] = None


class AttendeeResponse(BaseModel):
    """Model for attendee response"""
    id: str = Field(alias="$id")
    created_at: str = Field(alias="$createdAt")
    event_id: str
    first_name: str
    last_name: str
    other_names: Optional[str] = None
    email: str
    phone_number: Optional[str] = None
    registration_id: str
    paid: bool
    approved: bool
    verified: bool
    verified_at: Optional[str] = None
    approved_at: Optional[str] = None
    custom_responses: Optional[str] = None  # JSON string of custom question responses
    ticket_type_id: Optional[str] = None
    ticket_name: Optional[str] = None
    amount_paid: Optional[float] = None
    coupon_code: Optional[str] = None
    coupon_discount: Optional[float] = None

    @field_validator('phone_number', mode='before')
    @classmethod
    def coerce_phone_to_str(cls, v):
        if v is None:
            return None
        return str(v)
    
    class Config:
        populate_by_name = True
        # Allow extra fields that aren't in model
        extra = 'ignore'


class AttendeeListResponse(BaseModel):
    """Model for list of attendees"""
    documents: List[AttendeeResponse]
    total: int


class QRVerifyRequest(BaseModel):
    """Model for QR code verification request"""
    eventId: str
    qrCode: str


class QRVerifyResponse(BaseModel):
    """Model for QR code verification response"""
    valid: bool
    attendee: Optional[AttendeeResponse] = None
    message: str


class CheckInRequest(BaseModel):
    """Model for check-in toggle request"""
    eventId: str
    attendeeId: str


class ExploreFilters(BaseModel):
    """Model for explore page filters"""
    city: Optional[str] = None
    category: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    isPaid: Optional[bool] = None
    isVirtual: Optional[bool] = None
    search: Optional[str] = None
    limit: Optional[int] = 50
    offset: Optional[int] = 0
