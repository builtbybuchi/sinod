"""
File Storage Service
Handles file uploads with support for local storage and Appwrite Storage
"""

import os
import uuid
import mimetypes
from datetime import datetime
from typing import Optional, BinaryIO
from pathlib import Path
from appwrite.client import Client
from appwrite.services.storage import Storage
from appwrite.id import ID
from appwrite.services.databases import Databases

from config import settings
from models.storage_models import FileUploadResponse, FileMetadata, DeleteFileResponse


class StorageService:
    def __init__(self):
        # Initialize Appwrite client
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        
        self.storage = Storage(self.client)
        self.databases = Databases(self.client)
        
        # Storage configuration
        self.database_id = settings.APPWRITE_DATABASE_ID
        self.files_collection_id = settings.APPWRITE_FILES_COLLECTION_ID or 'files_metadata'
        self.storage_bucket_id = settings.APPWRITE_BUCKET_ID or 'main-storage'
        
        # Local storage fallback
        self.use_local_storage = getattr(settings, 'USE_LOCAL_STORAGE', False)
        self.local_storage_path = getattr(settings, 'LOCAL_STORAGE_PATH', './uploads')
        
        if self.use_local_storage:
            Path(self.local_storage_path).mkdir(parents=True, exist_ok=True)

    def _get_file_extension(self, filename: str) -> str:
        """Get file extension from filename"""
        return Path(filename).suffix.lower()

    def _get_mime_type(self, filename: str) -> str:
        """Get MIME type from filename"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or 'application/octet-stream'

    def _validate_file(self, filename: str, file_content: bytes, file_type: str) -> None:
        """Validate file based on type"""
        # Size limits (in bytes)
        size_limits = {
            'profile_picture': 5 * 1024 * 1024,  # 5MB
            'chat_file': 50 * 1024 * 1024,  # 50MB
            'event_image': 10 * 1024 * 1024,  # 10MB
            'document_attachment': 50 * 1024 * 1024,  # 50MB
            'other': 50 * 1024 * 1024  # 50MB
        }
        
        file_size = len(file_content)
        max_size = size_limits.get(file_type, 50 * 1024 * 1024)
        
        if file_size > max_size:
            raise ValueError(f"File size exceeds maximum allowed size of {max_size / (1024*1024)}MB")
        
        # Allowed extensions by type
        allowed_extensions = {
            'profile_picture': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
            'event_image': ['.jpg', '.jpeg', '.png', '.webp'],
            'chat_file': ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.mp4', '.mp3'],
            'document_attachment': ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx'],
            'other': None  # Allow all
        }
        
        ext = self._get_file_extension(filename)
        allowed = allowed_extensions.get(file_type)
        
        if allowed and ext not in allowed:
            raise ValueError(f"File type not allowed. Allowed types: {', '.join(allowed)}")

    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        user_id: str,
        file_type: str = 'other',
        is_public: bool = False
    ) -> FileUploadResponse:
        """
        Upload a file to storage
        
        Args:
            file_content: Binary file content
            filename: Original filename
            user_id: ID of user uploading the file
            file_type: Type of file (profile_picture, chat_file, etc.)
            is_public: Whether file should be publicly accessible
        """
        try:
            # Validate file
            self._validate_file(filename, file_content, file_type)
            
            # Generate unique file ID and name
            file_id = str(uuid.uuid4())
            ext = self._get_file_extension(filename)
            unique_filename = f"{file_id}{ext}"
            
            # Get MIME type
            mime_type = self._get_mime_type(filename)
            
            if self.use_local_storage:
                # Local storage
                storage_path = os.path.join(self.local_storage_path, unique_filename)
                
                with open(storage_path, 'wb') as f:
                    f.write(file_content)
                
                file_url = f"{settings.BACKEND_URL}/api/files/{file_id}"
            else:
                # Appwrite storage
                # Create a temporary file
                temp_path = f"/tmp/{unique_filename}"
                with open(temp_path, 'wb') as f:
                    f.write(file_content)
                
                # Upload to Appwrite
                result = self.storage.create_file(
                    bucket_id=self.storage_bucket_id,
                    file_id=file_id,
                    file=temp_path
                )
                
                # Clean up temp file
                os.remove(temp_path)
                
                # Get file URL
                file_url = f"{settings.APPWRITE_ENDPOINT}/storage/buckets/{self.storage_bucket_id}/files/{file_id}/view"
                storage_path = f"appwrite://{self.storage_bucket_id}/{file_id}"
            
            # Store metadata in database
            now = datetime.utcnow().isoformat()
            metadata = {
                'file_id': file_id,
                'filename': unique_filename,
                'original_filename': filename,
                'size': len(file_content),
                'mime_type': mime_type,
                'url': file_url,
                'storage_path': storage_path,
                'uploaded_by': user_id,
                'uploaded_at': now,
                'file_type': file_type,
                'is_public': is_public
            }
            
            self.databases.create_document(
                database_id=self.database_id,
                collection_id=self.files_collection_id,
                document_id=file_id,
                data=metadata
            )
            
            return FileUploadResponse(
                file_id=file_id,
                filename=unique_filename,
                url=file_url,
                size=len(file_content),
                mime_type=mime_type,
                uploaded_at=now,
                uploaded_by=user_id
            )
            
        except Exception as e:
            raise Exception(f"File upload failed: {str(e)}")

    async def get_file(self, file_id: str) -> Optional[FileMetadata]:
        """Get file metadata by ID"""
        try:
            doc = self.databases.get_document(
                database_id=self.database_id,
                collection_id=self.files_collection_id,
                document_id=file_id
            )
            
            return FileMetadata(**doc)
        except Exception:
            return None

    async def get_file_content(self, file_id: str) -> Optional[bytes]:
        """Get file content (for local storage)"""
        try:
            metadata = await self.get_file(file_id)
            
            if not metadata:
                return None
            
            if self.use_local_storage:
                file_path = os.path.join(self.local_storage_path, metadata.filename)
                
                if os.path.exists(file_path):
                    with open(file_path, 'rb') as f:
                        return f.read()
            else:
                # For Appwrite, return the download URL
                return None
            
            return None
        except Exception:
            return None

    async def delete_file(self, file_id: str, user_id: str) -> DeleteFileResponse:
        """Delete a file"""
        try:
            # Get file metadata
            metadata = await self.get_file(file_id)
            
            if not metadata:
                return DeleteFileResponse(success=False, message="File not found")
            
            # Check if user owns the file
            if metadata.uploaded_by != user_id:
                return DeleteFileResponse(success=False, message="Unauthorized")
            
            # Delete from storage
            if self.use_local_storage:
                file_path = os.path.join(self.local_storage_path, metadata.filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
            else:
                # Delete from Appwrite
                self.storage.delete_file(
                    bucket_id=self.storage_bucket_id,
                    file_id=file_id
                )
            
            # Delete metadata
            self.databases.delete_document(
                database_id=self.database_id,
                collection_id=self.files_collection_id,
                document_id=file_id
            )
            
            return DeleteFileResponse(success=True, message="File deleted successfully")
            
        except Exception as e:
            return DeleteFileResponse(success=False, message=f"Failed to delete file: {str(e)}")

    async def update_file_url(self, file_id: str, new_url: str) -> bool:
        """Update file URL (useful for CDN migrations)"""
        try:
            self.databases.update_document(
                database_id=self.database_id,
                collection_id=self.files_collection_id,
                document_id=file_id,
                data={'url': new_url}
            )
            return True
        except Exception:
            return False


# Global service instance
storage_service = StorageService()
