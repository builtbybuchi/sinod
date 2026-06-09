"""
Pydantic models for Event Reminders.
Reminders are sent to event attendees at specified times before an event.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ReminderOffsetType(str, Enum):
    """How the reminder time is calculated"""
    BEFORE_START = "before_start"  # X minutes before event start
    CUSTOM = "custom"              # Specific datetime set by user


class ReminderStatus(str, Enum):
    """Status of a reminder"""
    PENDING = "pending"
    PROCESSING = "processing"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"


# Preset reminder options (in minutes before event)
REMINDER_PRESETS = {
    "15_minutes": 15,
    "30_minutes": 30,
    "1_hour": 60,
    "2_hours": 120,
    "1_day": 1440,
    "2_days": 2880,
    "1_week": 10080,
}


# ==================== REQUEST MODELS ====================

class ReminderCreate(BaseModel):
    """Create a new event reminder"""
    event_id: str = Field(..., description="Event ID (event_page_url)")
    
    # When to send
    offset_type: ReminderOffsetType = ReminderOffsetType.BEFORE_START
    offset_minutes: int = Field(60, ge=1, description="Minutes before event start")
    remind_at: Optional[datetime] = Field(None, description="Specific time (if offset_type=custom)")
    
    # Email content
    subject: Optional[str] = Field(None, description="Custom subject (defaults to event name)")
    message: Optional[str] = Field(None, description="Custom message body")
    
    # Metadata
    created_by: str = Field(..., description="Email of the organizer creating this")


class ReminderUpdate(BaseModel):
    """Update an existing reminder"""
    offset_type: Optional[ReminderOffsetType] = None
    offset_minutes: Optional[int] = Field(None, ge=1)
    remind_at: Optional[datetime] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    status: Optional[ReminderStatus] = None


class ReminderBulkCreate(BaseModel):
    """Create multiple reminders at once (common for event setup)"""
    event_id: str
    created_by: str
    presets: List[str] = Field(
        default=["1_hour", "1_day"],
        description="List of preset keys: 15_minutes, 30_minutes, 1_hour, 2_hours, 1_day, 2_days, 1_week"
    )
    custom_subject: Optional[str] = None
    custom_message: Optional[str] = None


# ==================== RESPONSE MODELS ====================

class ReminderResponse(BaseModel):
    """Response model for a single reminder"""
    id: str = Field(alias="$id")
    event_id: str
    offset_type: str
    offset_minutes: int
    remind_at: Optional[str] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    status: str
    sent_at: Optional[str] = None
    sent_count: int = 0
    failed_count: int = 0
    created_by: str
    created_at: str
    
    class Config:
        populate_by_name = True


class ReminderListResponse(BaseModel):
    """Response for listing reminders"""
    reminders: List[ReminderResponse]
    total: int


class ReminderPresetOption(BaseModel):
    """A preset reminder option for the frontend"""
    key: str
    label: str
    minutes: int


class ReminderPresetsResponse(BaseModel):
    """Available reminder presets"""
    presets: List[ReminderPresetOption]
