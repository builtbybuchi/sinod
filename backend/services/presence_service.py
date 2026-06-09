"""
Presence Tracking Service
Real-time presence tracking for documents, whiteboards, and chat
"""

from datetime import datetime, timedelta
from typing import List, Optional
import random
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
from appwrite.id import ID

from config import settings
from models.presence_models import (
    PresenceUpdate, PresenceResponse, ActiveUsersResponse
)


class PresenceService:
    def __init__(self):
        # Initialize Appwrite client
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        
        self.databases = Databases(self.client)
        self.database_id = settings.APPWRITE_DATABASE_ID
        self.presence_collection_id = settings.APPWRITE_PRESENCE_COLLECTION_ID or 'presence'
        
        # Presence timeout (seconds)
        self.presence_timeout = 30  # User considered inactive after 30 seconds

    def _generate_user_color(self) -> str:
        """Generate a random color for user presence"""
        colors = [
            '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
            '#06B6D4', '#6366F1', '#EF4444', '#14B8A6', '#F97316',
            '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6'
        ]
        return random.choice(colors)

    async def update_presence(self, data: PresenceUpdate) -> PresenceResponse:
        """
        Update or create user presence
        
        Args:
            data: Presence update data
        """
        try:
            now = datetime.utcnow().isoformat()
            
            # Check if presence record exists
            existing = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.presence_collection_id,
                queries=[
                    Query.equal('resource_type', data.resource_type),
                    Query.equal('resource_id', data.resource_id),
                    Query.equal('user_email', data.user_email),
                    Query.limit(1)
                ]
            )
            
            if existing['total'] > 0:
                # Update existing presence
                presence_id = existing.get('documents', existing.get('rows', []))[0]['$id']
                doc = self.databases.update_document(
                    database_id=self.database_id,
                    collection_id=self.presence_collection_id,
                    document_id=presence_id,
                    data={
                        'is_active': data.is_active,
                        'last_seen': now,
                        'user_name': data.user_name or data.user_email,
                        'metadata': data.metadata or {}
                    }
                )
            else:
                # Create new presence
                presence_id = ID.unique()
                doc = self.databases.create_document(
                    database_id=self.database_id,
                    collection_id=self.presence_collection_id,
                    document_id=presence_id,
                    data={
                        'resource_type': data.resource_type,
                        'resource_id': data.resource_id,
                        'user_email': data.user_email,
                        'user_name': data.user_name or data.user_email,
                        'color': self._generate_user_color(),
                        'is_active': data.is_active,
                        'last_seen': now,
                        'metadata': data.metadata or {}
                    }
                )
            
            return PresenceResponse(
                id=doc['$id'],
                resource_type=doc['resource_type'],
                resource_id=doc['resource_id'],
                user_email=doc['user_email'],
                user_name=doc['user_name'],
                color=doc['color'],
                is_active=doc['is_active'],
                last_seen=doc['last_seen'],
                metadata=doc.get('metadata', {})
            )
            
        except Exception as e:
            raise Exception(f"Failed to update presence: {str(e)}")

    async def get_active_users(
        self,
        resource_type: str,
        resource_id: str
    ) -> ActiveUsersResponse:
        """
        Get all active users for a resource
        
        Args:
            resource_type: Type of resource (document, whiteboard, etc.)
            resource_id: ID of the resource
        """
        try:
            # Get all presence records for this resource
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.presence_collection_id,
                queries=[
                    Query.equal('resource_type', resource_type),
                    Query.equal('resource_id', resource_id),
                    Query.equal('is_active', True),
                    Query.limit(100)
                ]
            )
            
            # Filter out stale presence (not updated in last 30 seconds)
            now = datetime.utcnow()
            cutoff = now - timedelta(seconds=self.presence_timeout)
            
            active_users = []
            for doc in result.get('documents', result.get('rows', [])):
                last_seen = datetime.fromisoformat(doc['last_seen'].replace('Z', '+00:00'))
                
                if last_seen >= cutoff:
                    active_users.append(PresenceResponse(
                        id=doc['$id'],
                        resource_type=doc['resource_type'],
                        resource_id=doc['resource_id'],
                        user_email=doc['user_email'],
                        user_name=doc['user_name'],
                        color=doc['color'],
                        is_active=doc['is_active'],
                        last_seen=doc['last_seen'],
                        metadata=doc.get('metadata', {})
                    ))
                else:
                    # Mark as inactive
                    self.databases.update_document(
                        database_id=self.database_id,
                        collection_id=self.presence_collection_id,
                        document_id=doc['$id'],
                        data={'is_active': False}
                    )
            
            return ActiveUsersResponse(
                resource_id=resource_id,
                resource_type=resource_type,
                users=active_users,
                total=len(active_users)
            )
            
        except Exception as e:
            raise Exception(f"Failed to get active users: {str(e)}")

    async def deactivate_presence(
        self,
        resource_type: str,
        resource_id: str,
        user_email: str
    ) -> bool:
        """
        Mark user as inactive
        
        Args:
            resource_type: Type of resource
            resource_id: ID of the resource
            user_email: User's email
        """
        try:
            # Find presence record
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.presence_collection_id,
                queries=[
                    Query.equal('resource_type', resource_type),
                    Query.equal('resource_id', resource_id),
                    Query.equal('user_email', user_email),
                    Query.limit(1)
                ]
            )
            
            if result['total'] > 0:
                presence_id = result.get('documents', result.get('rows', []))[0]['$id']
                self.databases.update_document(
                    database_id=self.database_id,
                    collection_id=self.presence_collection_id,
                    document_id=presence_id,
                    data={
                        'is_active': False,
                        'last_seen': datetime.utcnow().isoformat()
                    }
                )
                return True
            
            return False
            
        except Exception as e:
            raise Exception(f"Failed to deactivate presence: {str(e)}")

    async def cleanup_inactive_presence(self, hours: int = 24) -> int:
        """
        Clean up old inactive presence records
        
        Args:
            hours: Remove records older than this many hours
        
        Returns:
            Number of records deleted
        """
        try:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            cutoff_str = cutoff.isoformat()
            
            # Find old inactive records
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.presence_collection_id,
                queries=[
                    Query.equal('is_active', False),
                    Query.lessThan('last_seen', cutoff_str),
                    Query.limit(100)
                ]
            )
            
            deleted = 0
            for doc in result.get('documents', result.get('rows', [])):
                try:
                    self.databases.delete_document(
                        database_id=self.database_id,
                        collection_id=self.presence_collection_id,
                        document_id=doc['$id']
                    )
                    deleted += 1
                except Exception:
                    pass
            
            return deleted
            
        except Exception as e:
            raise Exception(f"Failed to cleanup presence: {str(e)}")


# Global service instance
presence_service = PresenceService()
