"""
File Storage Models
Models for file uploads and storage management
"""

from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    url: str
    size: int
    mime_type: str
    uploaded_at: str
    uploaded_by: str


class FileMetadata(BaseModel):
    file_id: str
    filename: str
    original_filename: str
    size: int
    mime_type: str
    url: str
    storage_path: str
    uploaded_by: str
    uploaded_at: datetime
    file_type: Literal['profile_picture', 'chat_file', 'event_image', 'document_attachment', 'other']
    is_public: bool = False


class DeleteFileResponse(BaseModel):
    success: bool
    message: str
