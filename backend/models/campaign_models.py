"""
Pydantic models for Email Campaign/Newsletter system.
Supports mailing lists, campaigns, tracking, templates, and analytics.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from enum import Enum


# ==================== ENUMS ====================

class SubscriberSource(str, Enum):
    MANUAL = "manual"
    CSV = "csv"
    EVENT = "event"
    TEAM = "team"


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SendType(str, Enum):
    IMMEDIATE = "immediate"
    SCHEDULED = "scheduled"


class RecipientStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    UNSUBSCRIBED = "unsubscribed"


class EmailEventType(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    UNSUBSCRIBED = "unsubscribed"


class ScheduledCampaignStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ==================== MAILING LIST MODELS ====================

class MailingListBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default="", max_length=1000)


class MailingListCreate(MailingListBase):
    pass


class MailingListUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class MailingListResponse(MailingListBase):
    id: str
    owner_email: str
    subscriber_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== SUBSCRIBER MODELS ====================

class SubscriberBase(BaseModel):
    email: EmailStr
    name: Optional[str] = Field(default="", max_length=255)
    subscribed: bool = True


class SubscriberCreate(SubscriberBase):
    source: SubscriberSource = SubscriberSource.MANUAL
    event_id: Optional[str] = None


class SubscriberBulkCreate(BaseModel):
    """For adding multiple subscribers at once"""
    subscribers: List[SubscriberCreate]


class CSVImportRequest(BaseModel):
    """Request model for CSV import"""
    csv_content: str  # Base64 encoded CSV content
    list_id: str


class CSVImportResponse(BaseModel):
    """Response model for CSV import"""
    total_rows: int
    imported: int
    duplicates: int
    invalid: int
    errors: List[str] = []


class SubscriberResponse(SubscriberBase):
    id: str
    list_id: str
    source: SubscriberSource
    event_id: Optional[str] = None
    subscribed_at: datetime
    unsubscribed_at: Optional[datetime] = None
    unsubscribe_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SubscriberUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    subscribed: Optional[bool] = None


# ==================== EMAIL CAMPAIGN MODELS ====================

class CampaignBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    subject: str = Field(..., min_length=1, max_length=500)
    sender_name: str = Field(..., min_length=1, max_length=255)
    sender_logo_url: Optional[str] = Field(None, max_length=2000)  # Logo URL for sender avatar in email clients (BIMI)
    reply_to_email: Optional[str] = Field(None, max_length=500)  # Reply-to email for the campaign
    content_html: str = Field(..., min_length=1, max_length=200000)
    content_json: Optional[str] = Field(None, max_length=100000)  # For drag-drop editor state


class CampaignCreate(CampaignBase):
    recipient_list_ids: Optional[List[str]] = []  # Mailing list IDs to send to
    recipient_event_ids: Optional[List[str]] = []  # Event IDs for attendee lists
    recipient_filter: Optional[str] = "all"  # "all", "subscribed", etc.
    scheduled_at: Optional[datetime] = None  # If set, campaign is scheduled


class CampaignUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    sender_name: Optional[str] = Field(None, min_length=1, max_length=255)
    sender_logo_url: Optional[str] = Field(None, max_length=2000)
    reply_to_email: Optional[str] = Field(None, max_length=500)
    content_html: Optional[str] = Field(None, min_length=1, max_length=200000)
    content_json: Optional[str] = Field(None, max_length=100000)
    recipient_list_ids: Optional[List[str]] = None
    recipient_event_ids: Optional[List[str]] = None
    recipient_filter: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[CampaignStatus] = None


class CampaignResponse(CampaignBase):
    id: str
    owner_email: str
    status: CampaignStatus = CampaignStatus.DRAFT
    recipient_list_ids: List[str] = []
    recipient_event_ids: List[str] = []
    recipient_filter: str = "all"
    total_recipients: int = 0
    sent_count: int = 0
    failed_count: int = 0
    open_count: int = 0
    click_count: int = 0
    unsubscribe_count: int = 0
    bounce_count: int = 0
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SendCampaignRequest(BaseModel):
    """Request model for sending a campaign"""
    scheduled_at: Optional[datetime] = None  # If set, schedule for later; otherwise send immediately


class SendCampaignResponse(BaseModel):
    """Response after initiating campaign send"""
    campaign_id: str
    status: CampaignStatus
    total_recipients: int
    message: str


# ==================== CAMPAIGN RECIPIENT MODELS ====================

class CampaignRecipientBase(BaseModel):
    email: EmailStr
    name: Optional[str] = ""


class CampaignRecipientResponse(CampaignRecipientBase):
    id: str
    campaign_id: str
    status: RecipientStatus = RecipientStatus.PENDING
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    open_count: int = 0
    clicked_at: Optional[datetime] = None
    click_count: int = 0
    bounced_at: Optional[datetime] = None
    bounce_reason: Optional[str] = None
    unsubscribed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== EMAIL EVENT MODELS ====================

class EmailEventBase(BaseModel):
    campaign_id: str
    recipient_email: EmailStr
    event_type: EmailEventType


class EmailEventCreate(EmailEventBase):
    link_url: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None


class EmailEventResponse(EmailEventBase):
    id: str
    link_url: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== CAMPAIGN TEMPLATE MODELS ====================

class TemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default="", max_length=1000)
    content_json: str = Field(..., min_length=1, max_length=100000)
    content_html: Optional[str] = Field(None, max_length=100000)
    is_public: bool = False


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    content_json: Optional[str] = Field(None, min_length=1, max_length=100000)
    content_html: Optional[str] = Field(None, max_length=100000)
    is_public: Optional[bool] = None


class TemplateResponse(TemplateBase):
    id: str
    owner_email: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== SCHEDULED CAMPAIGN MODELS ====================

class ScheduledCampaignResponse(BaseModel):
    id: str
    campaign_id: str
    scheduled_at: datetime
    status: ScheduledCampaignStatus = ScheduledCampaignStatus.PENDING
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== UNSUBSCRIBE MODELS ====================

class UnsubscribeRequest(BaseModel):
    """Public unsubscribe request from email link"""
    reason: Optional[str] = Field(None, max_length=255)
    details: Optional[str] = Field(None, max_length=1000)


class UnsubscribeResponse(BaseModel):
    success: bool
    message: str


class CampaignUnsubscribeResponse(BaseModel):
    id: str
    campaign_id: str
    list_id: str
    email: str
    reason: Optional[str] = None
    details: Optional[str] = None
    owner_email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== CAMPAIGN ANALYTICS MODELS ====================

class CampaignAnalyticsResponse(BaseModel):
    id: str
    campaign_id: str
    total_recipients: int = 0
    sent_count: int = 0
    delivered_count: int = 0
    opened_count: int = 0
    unique_opens: int = 0
    clicked_count: int = 0
    unique_clicks: int = 0
    bounced_count: int = 0
    unsubscribed_count: int = 0
    open_rate: float = 0.0
    click_rate: float = 0.0
    bounce_rate: float = 0.0
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== AUDIENCE SELECTION MODELS ====================

class EventAudienceFilter(BaseModel):
    """Filter for selecting audience from events"""
    event_ids: List[str]
    include_registered: bool = True
    include_approved: bool = True
    include_verified: bool = True


class AudienceSelection(BaseModel):
    """Combined audience selection for a campaign"""
    list_ids: List[str] = []  # From mailing lists
    manual_emails: List[SubscriberCreate] = []  # Manually added
    event_filter: Optional[EventAudienceFilter] = None  # From events
    include_team: bool = False  # Include team members


class AudiencePreviewResponse(BaseModel):
    """Preview of selected audience before sending"""
    total_count: int
    from_lists: int
    from_events: int
    from_manual: int
    from_team: int
    duplicate_removed: int
    emails_preview: List[str] = []  # First 10 emails for preview


# ==================== SPAM WARNING MODEL ====================

class SpamWarningAcknowledgement(BaseModel):
    """User acknowledgement of spam warning before sending"""
    acknowledged: bool = False
    campaign_id: str
