"""
Document Collaboration Models
Pydantic models for document management and collaboration
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DocumentCreate(BaseModel):
    """Model for creating a new document"""
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = Field(default='{"type":"doc","content":[]}', description="Serialized Yjs document")
    collaborators: Optional[List[str]] = Field(default_factory=list, description="Array of user emails")
    is_public: bool = Field(default=False, alias="isPublic")

    class Config:
        populate_by_name = True


class DocumentUpdate(BaseModel):
    """Model for updating an existing document"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, description="Serialized Yjs document")
    collaborators: Optional[List[str]] = Field(None, description="Array of user emails")
    is_public: Optional[bool] = Field(None, alias="isPublic")
    updated_at: Optional[str] = Field(None, alias="updatedAt")

    class Config:
        populate_by_name = True


class DocumentResponse(BaseModel):
    """Model for document response"""
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


class DocumentListResponse(BaseModel):
    """Model for document list response"""
    documents: List[DocumentResponse]
    total: int


class DocumentListItem(BaseModel):
    """Simplified document info for list views"""
    id: str = Field(alias="$id")
    title: str
    created_by: str = Field(alias="createdBy")
    updated_at: str = Field(alias="updatedAt")
    collaborators: List[str]
    is_owner: bool = Field(alias="isOwner")

    class Config:
        populate_by_name = True


# Document Invites
class InviteCreate(BaseModel):
    """Model for creating a document invite"""
    document_id: str = Field(alias="documentId")
    email: str
    invited_by: str = Field(alias="invitedBy")
    invited_by_name: Optional[str] = Field(None, alias="invitedByName")
    document_title: str = Field(alias="documentTitle")

    class Config:
        populate_by_name = True


class InviteResponse(BaseModel):
    """Model for invite response"""
    id: str = Field(alias="$id")
    document_id: str = Field(alias="documentId")
    email: str
    invited_by: str = Field(alias="invitedBy")
    invited_by_name: Optional[str] = Field(None, alias="invitedByName")
    status: str  # 'pending' | 'accepted' | 'rejected'
    token: str
    created_at: str = Field(alias="createdAt")
    responded_at: Optional[str] = Field(None, alias="respondedAt")
    document_title: Optional[str] = Field(None, alias="documentTitle")

    class Config:
        populate_by_name = True


class InviteListResponse(BaseModel):
    """Model for invite list response"""
    documents: List[InviteResponse]
    total: int


# Document Presence
class PresenceCreate(BaseModel):
    """Model for creating presence tracking"""
    document_id: str = Field(alias="documentId")
    user_email: str = Field(alias="userEmail")
    user_name: Optional[str] = Field(None, alias="userName")
    color: str

    class Config:
        populate_by_name = True


class PresenceResponse(BaseModel):
    """Model for presence response"""
    id: str = Field(alias="$id")
    document_id: str = Field(alias="documentId")
    user_email: str = Field(alias="userEmail")
    user_name: Optional[str] = Field(None, alias="userName")
    color: str
    last_seen: str = Field(alias="lastSeen")
    is_active: bool = Field(alias="isActive")

    class Config:
        populate_by_name = True
