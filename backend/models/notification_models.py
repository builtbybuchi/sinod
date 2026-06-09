"""
Notification Models
Data models for the notification system
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    """Types of notifications"""
    INVITE = "invite"
    MENTION = "mention"
    COMMENT = "comment"
    EVENT_REMINDER = "event_reminder"
    PAYMENT = "payment"
    WITHDRAWAL = "withdrawal"
    CHAT = "chat"
    DOCUMENT = "document"
    WHITEBOARD = "whiteboard"
    SYSTEM = "system"


class NotificationPriority(str, Enum):
    """Notification priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationChannel(str, Enum):
    """Notification delivery channels"""
    IN_APP = "in_app"
    EMAIL = "email"
    PUSH = "push"


class CreateNotification(BaseModel):
    """Model for creating a new notification"""
    user_id: str = Field(..., description="User ID to send notification to")
    type: NotificationType = Field(..., description="Type of notification")
    title: str = Field(..., min_length=1, max_length=200, description="Notification title")
    message: str = Field(..., min_length=1, max_length=1000, description="Notification message")
    priority: NotificationPriority = Field(default=NotificationPriority.NORMAL)
    channels: List[NotificationChannel] = Field(
        default=[NotificationChannel.IN_APP],
        description="Channels to send notification through"
    )
    action_url: Optional[str] = Field(None, description="URL to navigate when clicked")
    metadata: Optional[Dict[str, Any]] = Field(
        default={},
        description="Additional data (document_id, event_id, etc.)"
    )
    expires_at: Optional[datetime] = Field(None, description="When notification expires")


class Notification(BaseModel):
    """Complete notification model"""
    id: str = Field(..., description="Notification ID")
    user_id: str
    type: NotificationType
    title: str
    message: str
    priority: NotificationPriority
    channels: List[NotificationChannel]
    action_url: Optional[str] = None
    metadata: Dict[str, Any] = {}
    is_read: bool = False
    is_archived: bool = False
    created_at: datetime
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    """Response model for notification"""
    success: bool
    notification: Optional[Notification] = None
    message: str


class NotificationListResponse(BaseModel):
    """Response model for list of notifications"""
    success: bool
    notifications: List[Notification]
    total: int
    unread_count: int


class MarkReadRequest(BaseModel):
    """Request to mark notifications as read"""
    notification_ids: List[str] = Field(..., description="List of notification IDs to mark as read")


class NotificationPreferences(BaseModel):
    """User notification preferences"""
    user_id: str
    enable_email: bool = True
    enable_push: bool = True
    enable_in_app: bool = True
    notification_types: Dict[NotificationType, bool] = {
        NotificationType.INVITE: True,
        NotificationType.MENTION: True,
        NotificationType.COMMENT: True,
        NotificationType.EVENT_REMINDER: True,
        NotificationType.PAYMENT: True,
        NotificationType.WITHDRAWAL: True,
        NotificationType.CHAT: True,
        NotificationType.DOCUMENT: True,
        NotificationType.WHITEBOARD: True,
        NotificationType.SYSTEM: True,
    }
    quiet_hours_start: Optional[int] = Field(None, ge=0, le=23, description="Quiet hours start (0-23)")
    quiet_hours_end: Optional[int] = Field(None, ge=0, le=23, description="Quiet hours end (0-23)")


class UpdatePreferencesRequest(BaseModel):
    """Request to update notification preferences"""
    enable_email: Optional[bool] = None
    enable_push: Optional[bool] = None
    enable_in_app: Optional[bool] = None
    notification_types: Optional[Dict[str, bool]] = None
    quiet_hours_start: Optional[int] = Field(None, ge=0, le=23)
    quiet_hours_end: Optional[int] = Field(None, ge=0, le=23)
