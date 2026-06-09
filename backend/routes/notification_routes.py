"""
Notification Routes
API endpoints for notification management
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Optional

from models.notification_models import (
    CreateNotification,
    NotificationResponse,
    NotificationListResponse,
    MarkReadRequest,
    UpdatePreferencesRequest,
    NotificationPreferences
)
from services.notification_service import notification_service
from routes.auth_routes import get_current_user


router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.post("/", response_model=NotificationResponse)
async def create_notification(
    data: CreateNotification,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(get_current_user)
):
    """
    Create a new notification
    
    Note: Notifications are filtered by user preferences (quiet hours, enabled channels, etc.)
    """
    try:
        notification = await notification_service.create_notification(data)
        
        if notification is None:
            return NotificationResponse(
                success=True,
                notification=None,
                message="Notification blocked by user preferences"
            )
        
        return NotificationResponse(
            success=True,
            notification=notification,
            message="Notification created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create notification: {str(e)}")


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user)
):
    """
    Get notifications for current user
    
    - **unread_only**: Only return unread notifications
    - **limit**: Maximum number of notifications to return (default: 50)
    - **offset**: Number of notifications to skip for pagination
    """
    try:
        notifications, total = await notification_service.get_user_notifications(
            user_id=user_id,
            unread_only=unread_only,
            limit=limit,
            offset=offset
        )
        
        unread_count = await notification_service.get_unread_count(user_id)
        
        return NotificationListResponse(
            success=True,
            notifications=notifications,
            total=total,
            unread_count=unread_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notifications: {str(e)}")


@router.get("/unread-count")
async def get_unread_count(user_id: str = Depends(get_current_user)):
    """Get count of unread notifications"""
    try:
        count = await notification_service.get_unread_count(user_id)
        return {"success": True, "count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get unread count: {str(e)}")


@router.post("/mark-read")
async def mark_notifications_read(
    data: MarkReadRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Mark notifications as read
    
    - **notification_ids**: List of notification IDs to mark as read
    """
    try:
        count = await notification_service.mark_as_read(data.notification_ids, user_id)
        return {
            "success": True,
            "count": count,
            "message": f"Marked {count} notifications as read"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark notifications as read: {str(e)}")


@router.post("/mark-all-read")
async def mark_all_read(user_id: str = Depends(get_current_user)):
    """Mark all notifications as read for current user"""
    try:
        count = await notification_service.mark_all_as_read(user_id)
        return {
            "success": True,
            "count": count,
            "message": f"Marked {count} notifications as read"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark all as read: {str(e)}")


@router.post("/{notification_id}/archive")
async def archive_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user)
):
    """Archive a notification"""
    try:
        success = await notification_service.archive_notification(notification_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"success": True, "message": "Notification archived"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to archive notification: {str(e)}")


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        success = await notification_service.delete_notification(notification_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"success": True, "message": "Notification deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete notification: {str(e)}")


@router.post("/cleanup")
async def cleanup_expired_notifications(
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user)
):
    """
    Cleanup expired notifications (admin/maintenance endpoint)
    
    Deletes notifications that have passed their expiration date
    """
    try:
        # Run cleanup in background
        background_tasks.add_task(notification_service.cleanup_expired)
        
        return {
            "success": True,
            "message": "Cleanup task scheduled"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule cleanup: {str(e)}")


# Notification Preferences Endpoints

@router.get("/preferences", response_model=NotificationPreferences)
async def get_preferences(user_id: str = Depends(get_current_user)):
    """Get notification preferences for current user"""
    try:
        preferences = await notification_service.get_user_preferences(user_id)
        return preferences
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get preferences: {str(e)}")


@router.put("/preferences", response_model=NotificationPreferences)
async def update_preferences(
    updates: UpdatePreferencesRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Update notification preferences
    
    - **enable_email**: Enable/disable email notifications
    - **enable_push**: Enable/disable push notifications
    - **enable_in_app**: Enable/disable in-app notifications
    - **notification_types**: Enable/disable specific notification types
    - **quiet_hours_start**: Hour to start quiet hours (0-23)
    - **quiet_hours_end**: Hour to end quiet hours (0-23)
    """
    try:
        preferences = await notification_service.update_user_preferences(user_id, updates)
        return preferences
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")


# Helper endpoint to send bulk notifications (for system use)

@router.post("/bulk")
async def send_bulk_notifications(
    notifications: list[CreateNotification],
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user)
):
    """
    Send multiple notifications at once
    
    Useful for system notifications, batch operations, etc.
    """
    try:
        sent_count = 0
        
        for notification in notifications:
            result = await notification_service.create_notification(notification)
            if result is not None:
                sent_count += 1
        
        return {
            "success": True,
            "sent": sent_count,
            "total": len(notifications),
            "message": f"Sent {sent_count} out of {len(notifications)} notifications"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send bulk notifications: {str(e)}")
