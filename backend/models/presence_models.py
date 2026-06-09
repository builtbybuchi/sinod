"""
Presence Models
Models for real-time presence tracking
"""

from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class PresenceUpdate(BaseModel):
    resource_type: Literal['document', 'whiteboard', 'chat', 'event']
    resource_id: str
    user_email: str
    user_name: Optional[str] = None
    is_active: bool = True
    metadata: Optional[dict] = {}  # For typing indicators, cursor position, etc.


class PresenceResponse(BaseModel):
    id: str
    resource_type: str
    resource_id: str
    user_email: str
    user_name: str
    color: str
    is_active: bool
    last_seen: str
    metadata: Optional[dict] = {}


class ActiveUsersResponse(BaseModel):
    resource_id: str
    resource_type: str
    users: list[PresenceResponse]
    total: int
