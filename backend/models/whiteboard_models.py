"""
Whiteboard-related Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr


class WhiteboardInviteEmailRequest(BaseModel):
    """Request model for sending whiteboard invite email"""
    to_email: EmailStr
    inviter_name: str
    whiteboard_title: str
    invite_token: str
