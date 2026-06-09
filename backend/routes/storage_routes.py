"""
File Storage Routes
API endpoints for file upload, download, and management
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Response
from fastapi.responses import FileResponse, StreamingResponse
from typing import Optional
import io

from services.storage_service import storage_service
from services.auth_service import auth_service
from routes.auth_routes import get_current_user
from models.storage_models import FileUploadResponse, DeleteFileResponse


router = APIRouter(prefix="/api/files", tags=["File Storage"])


@router.post("/upload/profile-picture", response_model=FileUploadResponse)
async def upload_profile_picture(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Upload a profile picture
    
    - Max size: 5MB
    - Allowed formats: JPG, PNG, GIF, WebP
    """
    try:
        content = await file.read()
        
        result = await storage_service.upload_file(
            file_content=content,
            filename=file.filename or 'profile.jpg',
            user_id=user_id,
            file_type='profile_picture',
            is_public=True
        )
        
        # Update user's avatar URL
        await auth_service.update_user(
            user_id,
            {'avatar': result.url}
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload/chat-file", response_model=FileUploadResponse)
async def upload_chat_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Upload a chat attachment file
    
    - Max size: 50MB
    - Allowed formats: Images, PDFs, Documents, Videos, Audio
    """
    try:
        content = await file.read()
        
        result = await storage_service.upload_file(
            file_content=content,
            filename=file.filename or 'file',
            user_id=user_id,
            file_type='chat_file',
            is_public=False
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload/event-image", response_model=FileUploadResponse)
async def upload_event_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Upload an event cover image
    
    - Max size: 10MB
    - Allowed formats: JPG, PNG, WebP
    """
    try:
        content = await file.read()
        
        result = await storage_service.upload_file(
            file_content=content,
            filename=file.filename or 'event.jpg',
            user_id=user_id,
            file_type='event_image',
            is_public=True
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload/document-attachment", response_model=FileUploadResponse)
async def upload_document_attachment(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Upload a document attachment
    
    - Max size: 50MB
    - Allowed formats: PDF, DOC, DOCX, TXT, XLSX, PPTX
    """
    try:
        content = await file.read()
        
        result = await storage_service.upload_file(
            file_content=content,
            filename=file.filename or 'document',
            user_id=user_id,
            file_type='document_attachment',
            is_public=False
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{file_id}")
async def get_file(file_id: str):
    """
    Get file by ID (download or view)
    
    For local storage: returns the file content
    For Appwrite storage: redirects to Appwrite CDN
    """
    try:
        metadata = await storage_service.get_file(file_id)
        
        if not metadata:
            raise HTTPException(status_code=404, detail="File not found")
        
        # For local storage, serve the file
        if storage_service.use_local_storage:
            content = await storage_service.get_file_content(file_id)
            
            if not content:
                raise HTTPException(status_code=404, detail="File content not found")
            
            return StreamingResponse(
                io.BytesIO(content),
                media_type=metadata.mime_type,
                headers={
                    "Content-Disposition": f"inline; filename={metadata.original_filename}"
                }
            )
        else:
            # For Appwrite, redirect to Appwrite URL
            return Response(
                status_code=307,
                headers={"Location": metadata.url}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file: {str(e)}")


@router.delete("/{file_id}", response_model=DeleteFileResponse)
async def delete_file(
    file_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete a file
    
    Only the file owner can delete it
    """
    try:
        result = await storage_service.delete_file(file_id, user_id)
        
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.get("/{file_id}/metadata")
async def get_file_metadata(
    file_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get file metadata
    
    Requires authentication
    """
    try:
        metadata = await storage_service.get_file(file_id)
        
        if not metadata:
            raise HTTPException(status_code=404, detail="File not found")
        
        return metadata
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metadata: {str(e)}")
