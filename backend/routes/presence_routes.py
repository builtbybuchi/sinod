"""
Presence Tracking Routes
API endpoints for real-time presence tracking
"""

from fastapi import APIRouter, HTTPException, Depends

from models.presence_models import (
    PresenceUpdate, PresenceResponse, ActiveUsersResponse
)
from services.presence_service import presence_service
from routes.auth_routes import get_current_user


router = APIRouter(prefix="/api/presence", tags=["Presence Tracking"])


@router.post("/update", response_model=PresenceResponse)
async def update_presence(
    data: PresenceUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    Update user presence for a resource
    
    - **resource_type**: Type of resource (document, whiteboard, chat, event)
    - **resource_id**: ID of the resource
    - **user_email**: User's email
    - **user_name**: User's display name (optional)
    - **is_active**: Whether user is currently active
    - **metadata**: Additional metadata (typing indicators, cursor position, etc.)
    
    Call this endpoint periodically (every 10-15 seconds) to maintain presence
    """
    try:
        result = await presence_service.update_presence(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update presence: {str(e)}")


@router.get("/{resource_type}/{resource_id}", response_model=ActiveUsersResponse)
async def get_active_users(
    resource_type: str,
    resource_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get all active users for a resource
    
    - **resource_type**: Type of resource (document, whiteboard, chat, event)
    - **resource_id**: ID of the resource
    
    Returns list of currently active users (updated within last 30 seconds)
    """
    try:
        result = await presence_service.get_active_users(resource_type, resource_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active users: {str(e)}")


@router.delete("/{resource_type}/{resource_id}")
async def deactivate_presence(
    resource_type: str,
    resource_id: str,
    user_email: str,
    user_id: str = Depends(get_current_user)
):
    """
    Deactivate user presence (call when user leaves)
    
    - **resource_type**: Type of resource
    - **resource_id**: ID of the resource
    - **user_email**: User's email to deactivate
    """
    try:
        success = await presence_service.deactivate_presence(
            resource_type,
            resource_id,
            user_email
        )
        
        return {"success": success, "message": "Presence deactivated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deactivate presence: {str(e)}")


@router.post("/cleanup")
async def cleanup_presence(
    hours: int = 24,
    user_id: str = Depends(get_current_user)
):
    """
    Cleanup old inactive presence records
    
    - **hours**: Remove records older than this many hours (default: 24)
    
    Admin endpoint for maintenance
    """
    try:
        deleted = await presence_service.cleanup_inactive_presence(hours)
        return {"success": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")
