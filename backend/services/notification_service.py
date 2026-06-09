"""
Notification Service
Handles notification creation, delivery, and management
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
from appwrite.id import ID
import logging

from config import settings
from models.notification_models import (
    CreateNotification,
    Notification,
    NotificationType,
    NotificationChannel,
    NotificationPreferences,
    UpdatePreferencesRequest
)

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing notifications"""
    
    def __init__(self):
        # Initialize Appwrite client
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        
        self.databases = Databases(self.client)
        self.database_id = settings.APPWRITE_DATABASE_ID
        self.notifications_collection_id = "notifications"  # Create this collection in Appwrite
        self.preferences_collection_id = "notification_preferences"
    
    async def create_notification(
        self,
        notification_data: CreateNotification
    ) -> Notification:
        """
        Create a new notification
        
        Args:
            notification_data: Notification creation data
            
        Returns:
            Created notification
        """
        try:
            # Check user preferences first
            preferences = await self.get_user_preferences(notification_data.user_id)
            
            # Filter channels based on preferences
            allowed_channels = []
            if preferences.enable_in_app and NotificationChannel.IN_APP in notification_data.channels:
                allowed_channels.append(NotificationChannel.IN_APP)
            if preferences.enable_email and NotificationChannel.EMAIL in notification_data.channels:
                allowed_channels.append(NotificationChannel.EMAIL)
            if preferences.enable_push and NotificationChannel.PUSH in notification_data.channels:
                allowed_channels.append(NotificationChannel.PUSH)
            
            # Check if notification type is enabled
            if not preferences.notification_types.get(notification_data.type, True):
                logger.info(f"Notification type {notification_data.type} disabled for user {notification_data.user_id}")
                return None
            
            # Check quiet hours
            if await self._is_quiet_hours(preferences):
                # Store notification but don't send via email/push
                allowed_channels = [NotificationChannel.IN_APP]
            
            if not allowed_channels:
                logger.info(f"No allowed channels for notification to user {notification_data.user_id}")
                return None
            
            # Create notification document
            now = datetime.utcnow()
            notification_doc = {
                "user_id": notification_data.user_id,
                "type": notification_data.type.value,
                "title": notification_data.title,
                "message": notification_data.message,
                "priority": notification_data.priority.value,
                "channels": [ch.value for ch in allowed_channels],
                "action_url": notification_data.action_url,
                "metadata": notification_data.metadata or {},
                "is_read": False,
                "is_archived": False,
                "created_at": now.isoformat(),
                "read_at": None,
                "expires_at": notification_data.expires_at.isoformat() if notification_data.expires_at else None
            }
            
            result = self.databases.create_document(
                database_id=self.database_id,
                collection_id=self.notifications_collection_id,
                document_id=ID.unique(),
                data=notification_doc
            )
            
            # Send via external channels (email, push)
            if NotificationChannel.EMAIL in allowed_channels:
                await self._send_email_notification(notification_data)
            
            if NotificationChannel.PUSH in allowed_channels:
                await self._send_push_notification(notification_data)
            
            return self._map_notification(result)
        
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")
            raise
    
    async def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[Notification], int]:
        """
        Get notifications for a user
        
        Args:
            user_id: User ID
            unread_only: Only return unread notifications
            limit: Maximum number of notifications to return
            offset: Number of notifications to skip
            
        Returns:
            Tuple of (notifications list, total count)
        """
        try:
            queries = [
                Query.equal("user_id", user_id),
                Query.equal("is_archived", False),
                Query.order_desc("created_at"),
                Query.limit(limit),
                Query.offset(offset)
            ]
            
            if unread_only:
                queries.append(Query.equal("is_read", False))
            
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.notifications_collection_id,
                queries=queries
            )
            
            notifications = [self._map_notification(doc) for doc in result.get("documents", result.get("rows", []))]
            
            # Filter out expired notifications
            now = datetime.utcnow()
            notifications = [
                n for n in notifications
                if n.expires_at is None or n.expires_at > now
            ]
            
            return notifications, result["total"]
        
        except Exception as e:
            logger.error(f"Failed to get user notifications: {str(e)}")
            return [], 0
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        try:
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.notifications_collection_id,
                queries=[
                    Query.equal("user_id", user_id),
                    Query.equal("is_read", False),
                    Query.equal("is_archived", False)
                ]
            )
            
            # Filter out expired
            now = datetime.utcnow()
            valid_count = sum(
                1 for doc in result.get("documents", result.get("rows", []))
                if not doc.get("expires_at") or datetime.fromisoformat(doc["expires_at"]) > now
            )
            
            return valid_count
        
        except Exception as e:
            logger.error(f"Failed to get unread count: {str(e)}")
            return 0
    
    async def mark_as_read(self, notification_ids: List[str], user_id: str) -> int:
        """
        Mark notifications as read
        
        Args:
            notification_ids: List of notification IDs
            user_id: User ID (for verification)
            
        Returns:
            Number of notifications marked as read
        """
        try:
            count = 0
            now = datetime.utcnow()
            
            for notification_id in notification_ids:
                # Verify notification belongs to user
                notification = self.databases.get_document(
                    database_id=self.database_id,
                    collection_id=self.notifications_collection_id,
                    document_id=notification_id
                )
                
                if notification["user_id"] == user_id and not notification["is_read"]:
                    self.databases.update_document(
                        database_id=self.database_id,
                        collection_id=self.notifications_collection_id,
                        document_id=notification_id,
                        data={
                            "is_read": True,
                            "read_at": now.isoformat()
                        }
                    )
                    count += 1
            
            return count
        
        except Exception as e:
            logger.error(f"Failed to mark notifications as read: {str(e)}")
            return 0
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        try:
            # Get all unread notifications
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.notifications_collection_id,
                queries=[
                    Query.equal("user_id", user_id),
                    Query.equal("is_read", False)
                ]
            )
            
            notification_ids = [doc["$id"] for doc in result.get("documents", result.get("rows", []))]
            return await self.mark_as_read(notification_ids, user_id)
        
        except Exception as e:
            logger.error(f"Failed to mark all as read: {str(e)}")
            return 0
    
    async def archive_notification(self, notification_id: str, user_id: str) -> bool:
        """Archive a notification"""
        try:
            # Verify notification belongs to user
            notification = self.databases.get_document(
                database_id=self.database_id,
                collection_id=self.notifications_collection_id,
                document_id=notification_id
            )
            
            if notification["user_id"] != user_id:
                return False
            
            self.databases.update_document(
                database_id=self.database_id,
                collection_id=self.notifications_collection_id,
                document_id=notification_id,
                data={"is_archived": True}
            )
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to archive notification: {str(e)}")
            return False
    
    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """Delete a notification"""
        try:
            # Verify notification belongs to user
            notification = self.databases.get_document(
                database_id=self.database_id,
                collection_id=self.notifications_collection_id,
                document_id=notification_id
            )
            
            if notification["user_id"] != user_id:
                return False
            
            self.databases.delete_document(
                database_id=self.database_id,
                collection_id=self.notifications_collection_id,
                document_id=notification_id
            )
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to delete notification: {str(e)}")
            return False
    
    async def cleanup_expired(self) -> int:
        """Delete expired notifications"""
        try:
            now = datetime.utcnow()
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.notifications_collection_id,
                queries=[Query.not_equal("expires_at", None)]
            )
            
            count = 0
            for doc in result.get("documents", result.get("rows", [])):
                expires_at = datetime.fromisoformat(doc["expires_at"])
                if expires_at < now:
                    self.databases.delete_document(
                        database_id=self.database_id,
                        collection_id=self.notifications_collection_id,
                        document_id=doc["$id"]
                    )
                    count += 1
            
            return count
        
        except Exception as e:
            logger.error(f"Failed to cleanup expired notifications: {str(e)}")
            return 0
    
    # Preferences Management
    
    async def get_user_preferences(self, user_id: str) -> NotificationPreferences:
        """Get user notification preferences"""
        try:
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.preferences_collection_id,
                queries=[Query.equal("user_id", user_id)]
            )
            
            if result["total"] > 0:
                return self._map_preferences(result.get("documents", result.get("rows", []))[0])
            
            # Create default preferences
            return NotificationPreferences(user_id=user_id)
        
        except Exception as e:
            logger.error(f"Failed to get user preferences: {str(e)}")
            return NotificationPreferences(user_id=user_id)
    
    async def update_user_preferences(
        self,
        user_id: str,
        updates: UpdatePreferencesRequest
    ) -> NotificationPreferences:
        """Update user notification preferences"""
        try:
            # Get existing preferences
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.preferences_collection_id,
                queries=[Query.equal("user_id", user_id)]
            )
            
            update_data = {}
            if updates.enable_email is not None:
                update_data["enable_email"] = updates.enable_email
            if updates.enable_push is not None:
                update_data["enable_push"] = updates.enable_push
            if updates.enable_in_app is not None:
                update_data["enable_in_app"] = updates.enable_in_app
            if updates.notification_types is not None:
                update_data["notification_types"] = updates.notification_types
            if updates.quiet_hours_start is not None:
                update_data["quiet_hours_start"] = updates.quiet_hours_start
            if updates.quiet_hours_end is not None:
                update_data["quiet_hours_end"] = updates.quiet_hours_end
            
            if result["total"] > 0:
                # Update existing
                updated = self.databases.update_document(
                    database_id=self.database_id,
                    collection_id=self.preferences_collection_id,
                    document_id=result.get("documents", result.get("rows", []))[0]["$id"],
                    data=update_data
                )
            else:
                # Create new
                update_data["user_id"] = user_id
                updated = self.databases.create_document(
                    database_id=self.database_id,
                    collection_id=self.preferences_collection_id,
                    document_id=ID.unique(),
                    data=update_data
                )
            
            return self._map_preferences(updated)
        
        except Exception as e:
            logger.error(f"Failed to update preferences: {str(e)}")
            raise
    
    # Helper methods
    
    def _map_notification(self, doc: Dict[str, Any]) -> Notification:
        """Map Appwrite document to Notification model"""
        return Notification(
            id=doc["$id"],
            user_id=doc["user_id"],
            type=NotificationType(doc["type"]),
            title=doc["title"],
            message=doc["message"],
            priority=doc["priority"],
            channels=[NotificationChannel(ch) for ch in doc["channels"]],
            action_url=doc.get("action_url"),
            metadata=doc.get("metadata", {}),
            is_read=doc["is_read"],
            is_archived=doc["is_archived"],
            created_at=datetime.fromisoformat(doc["created_at"]),
            read_at=datetime.fromisoformat(doc["read_at"]) if doc.get("read_at") else None,
            expires_at=datetime.fromisoformat(doc["expires_at"]) if doc.get("expires_at") else None
        )
    
    def _map_preferences(self, doc: Dict[str, Any]) -> NotificationPreferences:
        """Map Appwrite document to NotificationPreferences model"""
        return NotificationPreferences(
            user_id=doc["user_id"],
            enable_email=doc.get("enable_email", True),
            enable_push=doc.get("enable_push", True),
            enable_in_app=doc.get("enable_in_app", True),
            notification_types=doc.get("notification_types", {}),
            quiet_hours_start=doc.get("quiet_hours_start"),
            quiet_hours_end=doc.get("quiet_hours_end")
        )
    
    async def _is_quiet_hours(self, preferences: NotificationPreferences) -> bool:
        """Check if current time is within quiet hours"""
        if preferences.quiet_hours_start is None or preferences.quiet_hours_end is None:
            return False
        
        now = datetime.utcnow()
        current_hour = now.hour
        
        start = preferences.quiet_hours_start
        end = preferences.quiet_hours_end
        
        if start < end:
            return start <= current_hour < end
        else:  # Quiet hours span midnight
            return current_hour >= start or current_hour < end
    
    async def _send_email_notification(self, notification: CreateNotification):
        """Send notification via email (integrate with email service)"""
        # TODO: Integrate with email service
        logger.info(f"Would send email notification to user {notification.user_id}")
        pass
    
    async def _send_push_notification(self, notification: CreateNotification):
        """Send notification via push (integrate with push service)"""
        # TODO: Integrate with push notification service
        logger.info(f"Would send push notification to user {notification.user_id}")
        pass


# Create singleton instance
notification_service = NotificationService()
