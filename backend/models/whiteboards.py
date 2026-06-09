"""
Whiteboard Collaboration Models
Pydantic models for whiteboard management and collaboration
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class WhiteboardCreate(BaseModel):
    """Model for creating a new whiteboard"""
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = Field(default='{"elements":[],"appState":{}}', description="Serialized Excalidraw scene")
    collaborators: Optional[List[str]] = Field(default_factory=list, description="Array of user emails")
    is_public: bool = Field(default=False, alias="isPublic")

    class Config:
        populate_by_name = True


class WhiteboardUpdate(BaseModel):
    """Model for updating an existing whiteboard"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, description="Serialized Excalidraw scene")
    collaborators: Optional[List[str]] = Field(None, description="Array of user emails")
    is_public: Optional[bool] = Field(None, alias="isPublic")
    updated_at: Optional[str] = Field(None, alias="updatedAt")

    class Config:
        populate_by_name = True


class WhiteboardResponse(BaseModel):
    """Model for whiteboard response"""
    id: str = Field(alias="$id")
    title: str
    content: str
    created_by: str = Field(alias="createdBy")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
    collaborators: List[str]
    is_public: bool = Field(alias="isPublic")

    class Config:
        populate_by_name = True


class WhiteboardListResponse(BaseModel):
    """Model for whiteboard list response"""
    documents: List[WhiteboardResponse]
    total: int


class WhiteboardListItem(BaseModel):
    """Simplified whiteboard info for list views"""
    id: str = Field(alias="$id")
    title: str
    created_by: str = Field(alias="createdBy")
    updated_at: str = Field(alias="updatedAt")
    collaborators: List[str]
    is_owner: bool = Field(alias="isOwner")

    class Config:
        populate_by_name = True


# Whiteboard Invites
class WhiteboardInviteCreate(BaseModel):
    """Model for creating a whiteboard invite"""
    whiteboard_id: str = Field(alias="whiteboardId")
    email: str
    invited_by: str = Field(alias="invitedBy")

    class Config:
        populate_by_name = True


class WhiteboardInviteResponse(BaseModel):
    """Model for whiteboard invite response"""
    id: str = Field(alias="$id")
    whiteboard_id: str = Field(alias="whiteboardId")
    email: str
    invited_by: str = Field(alias="invitedBy")
    status: str  # 'pending' | 'accepted' | 'rejected'
    token: str
    created_at: str = Field(alias="createdAt")
    expires_at: str = Field(alias="expiresAt")

    class Config:
        populate_by_name = True


class WhiteboardInviteListResponse(BaseModel):
    """Model for whiteboard invite list response"""
    documents: List[WhiteboardInviteResponse]
    total: int


# Whiteboard Presence
class WhiteboardPresenceCreate(BaseModel):
    """Model for creating whiteboard presence tracking"""
    whiteboard_id: str = Field(alias="whiteboardId")
    user_email: str = Field(alias="userEmail")
    color: str

    class Config:
        populate_by_name = True


class WhiteboardPresenceResponse(BaseModel):
    """Model for whiteboard presence response"""
    id: str = Field(alias="$id")
    whiteboard_id: str = Field(alias="whiteboardId")
    user_email: str = Field(alias="userEmail")
    color: str
    last_seen: str = Field(alias="lastSeen")
    is_active: bool = Field(alias="isActive")

    class Config:
        populate_by_name = True
