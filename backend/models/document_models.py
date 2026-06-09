"""
Document invite email models
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class DocumentInviteEmailRequest(BaseModel):
    """Request model for sending document invite email"""
    to_email: EmailStr
    inviter_name: str
    document_title: str
    invite_token: str
