"""
Chat Models for Pydantic Validation
Defines models for conversations, messages, and participants
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ============================================================================
# CONVERSATION MODELS
# ============================================================================

class ConversationCreate(BaseModel):
    """Model for creating a new conversation"""
    type: str = Field(..., description="Type: 'direct' or 'group'")
    name: Optional[str] = Field(None, description="Conversation name (for groups)")
    description: Optional[str] = Field(None, description="Conversation description")
    avatar_url: Optional[str] = Field(None, alias="avatarUrl", description="Avatar URL")
    participants: List[str] = Field(..., description="List of participant emails")
    participant_names: List[str] = Field(..., alias="participantNames", description="List of participant names")
    participant_avatars: Optional[List[Optional[str]]] = Field(None, alias="participantAvatars", description="List of participant avatar URLs")
    created_by: str = Field(..., alias="createdBy", description="Creator email")

    class Config:
        populate_by_name = True


class ConversationUpdate(BaseModel):
    """Model for updating a conversation"""
    name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    
    class Config:
        populate_by_name = True


class ConversationResponse(BaseModel):
    """Response model for conversation"""
    id: str = Field(..., alias="$id", description="Document ID")
    type: str
    name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    participants: List[str]
    participant_names: List[str] = Field(..., alias="participantNames")
    participant_avatars: Optional[List[Optional[str]]] = Field(None, alias="participantAvatars")
    created_by: str = Field(..., alias="createdBy")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")
    last_message: Optional[str] = Field(None, alias="lastMessage")
    last_message_by: Optional[str] = Field(None, alias="lastMessageBy")
    last_message_at: Optional[str] = Field(None, alias="lastMessageAt")
    unread_counts: Optional[str] = Field(None, alias="unreadCounts", description="JSON string of unread counts")

    class Config:
        populate_by_name = True


class ConversationListResponse(BaseModel):
    """Response model for conversation list"""
    documents: List[ConversationResponse]
    total: int


# ============================================================================
# MESSAGE MODELS
# ============================================================================

class MessageCreate(BaseModel):
    """Model for creating a new message"""
    conversation_id: str = Field(..., alias="conversationId")
    sender_id: str = Field(..., alias="senderId", description="Sender email")
    sender_name: str = Field(..., alias="senderName")
    sender_avatar: Optional[str] = Field(None, alias="senderAvatar")
    content: str = Field(..., description="Message content")
    type: str = Field(default="text", description="Message type: text, image, file, system")
    attachment_url: Optional[str] = Field(None, alias="attachmentUrl")
    attachment_name: Optional[str] = Field(None, alias="attachmentName")
    attachment_size: Optional[int] = Field(None, alias="attachmentSize")
    reply_to: Optional[str] = Field(None, alias="replyTo", description="Message ID being replied to")

    class Config:
        populate_by_name = True


class MessageUpdate(BaseModel):
    """Model for updating a message"""
    content: Optional[str] = None
    is_edited: Optional[bool] = Field(None, alias="isEdited")
    
    class Config:
        populate_by_name = True


class MessageResponse(BaseModel):
    """Response model for message"""
    id: str = Field(..., alias="$id")
    conversation_id: str = Field(..., alias="conversationId")
    sender_id: str = Field(..., alias="senderId")
    sender_name: str = Field(..., alias="senderName")
    sender_avatar: Optional[str] = Field(None, alias="senderAvatar")
    content: str
    type: str
    attachment_url: Optional[str] = Field(None, alias="attachmentUrl")
    attachment_name: Optional[str] = Field(None, alias="attachmentName")
    attachment_size: Optional[int] = Field(None, alias="attachmentSize")
    created_at: str = Field(..., alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")
    is_edited: bool = Field(default=False, alias="isEdited")
    read_by: List[str] = Field(default_factory=list, alias="readBy")
    reply_to: Optional[str] = Field(None, alias="replyTo")

    class Config:
        populate_by_name = True


class MessageListResponse(BaseModel):
    """Response model for message list"""
    documents: List[MessageResponse]
    total: int


# ============================================================================
# PARTICIPANT MODELS
# ============================================================================

class ParticipantAdd(BaseModel):
    """Model for adding participants to a conversation"""
    emails: List[str] = Field(..., description="List of participant emails to add")
    names: List[str] = Field(..., description="List of participant names")
    avatars: Optional[List[Optional[str]]] = Field(None, description="List of participant avatar URLs")


class ParticipantRemove(BaseModel):
    """Model for removing a participant from a conversation"""
    email: str = Field(..., description="Email of participant to remove")


# ============================================================================
# PRESENCE MODELS
# ============================================================================

class PresenceCreate(BaseModel):
    """Model for creating/updating user presence"""
    user_email: str = Field(..., alias="userEmail")
    user_name: str = Field(..., alias="userName")
    status: str = Field(default="online", description="Status: online, away, offline")
    typing_in: Optional[str] = Field(None, alias="typingIn", description="Conversation ID user is typing in")

    class Config:
        populate_by_name = True


class PresenceResponse(BaseModel):
    """Response model for user presence"""
    id: str = Field(..., alias="$id")
    user_email: str = Field(..., alias="userEmail")
    user_name: str = Field(..., alias="userName")
    status: str
    last_seen: str = Field(..., alias="lastSeen")
    typing_in: Optional[str] = Field(None, alias="typingIn")

    class Config:
        populate_by_name = True


# ============================================================================
# UTILITY MODELS
# ============================================================================

class MarkAsReadParams(BaseModel):
    """Parameters for marking messages as read"""
    message_ids: List[str] = Field(..., alias="messageIds", description="List of message IDs to mark as read")
    user_email: str = Field(..., alias="userEmail", description="User email marking as read")

    class Config:
        populate_by_name = True
