"""
Pydantic models for the Newsletter Microservice API.
These define the request/response shapes for communication
between the main backend and this service.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


# ==================== ENUMS ====================

class JobStatus(str, Enum):
    """Status of a queued campaign job"""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RecipientResult(str, Enum):
    """Result of sending to a single recipient"""
    SENT = "sent"
    FAILED = "failed"


# ==================== REQUEST MODELS ====================

class RecipientInfo(BaseModel):
    """A single recipient in the send request"""
    email: str
    name: str = ""
    recipient_doc_id: str = ""  # Appwrite document ID for status updates


class SendCampaignRequest(BaseModel):
    """
    Request from main backend to enqueue a campaign for sending.
    Contains everything the microservice needs to send emails and
    update Appwrite directly.
    """
    campaign_id: str
    subject: str
    content_html: str
    sender_name: str
    owner_email: str
    list_id: str = ""
    sender_logo_url: str = ""
    reply_to_email: str = ""
    recipients: List[RecipientInfo]

    # Appwrite doc IDs for callback updates
    analytics_doc_id: str = ""


class ScheduleCampaignRequest(BaseModel):
    """Request to schedule a campaign for future sending"""
    campaign_id: str
    scheduled_at: datetime
    subject: str
    content_html: str
    sender_name: str
    owner_email: str
    list_id: str = ""
    sender_logo_url: str = ""
    reply_to_email: str = ""
    recipients: List[RecipientInfo]
    analytics_doc_id: str = ""


class CancelJobRequest(BaseModel):
    """Request to cancel a queued or scheduled job"""
    campaign_id: str


# ==================== RESPONSE MODELS ====================

class JobResponse(BaseModel):
    """Response after enqueuing a campaign"""
    job_id: str
    campaign_id: str
    status: JobStatus
    total_recipients: int
    message: str


class JobStatusResponse(BaseModel):
    """Detailed status of a campaign job"""
    job_id: str
    campaign_id: str
    status: JobStatus
    total_recipients: int
    sent_count: int = 0
    failed_count: int = 0
    progress_percent: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    environment: str
    queue_size: int
    active_jobs: int
    smtp_configured: bool


class RecipientSendResult(BaseModel):
    """Result of sending to one recipient"""
    email: str
    recipient_doc_id: str
    status: RecipientResult
    error: str = ""
