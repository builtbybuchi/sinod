"""
Context Service
Aggregates user context from Appwrite for AI assistance
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
from typing import Dict, Any, List, Optional
import logging
from config import settings

logger = logging.getLogger(__name__)

class ContextService:
    def __init__(self):
        """Initialize Appwrite client"""
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        
        self.databases = Databases(self.client)
        self.database_id = settings.APPWRITE_DATABASE_ID
        
        # Collection IDs
        self.events_collection = settings.APPWRITE_EVENTS_COLLECTION_ID
        self.documents_collection = settings.APPWRITE_DOCUMENTS_COLLECTION_ID
        self.tasks_collection = settings.APPWRITE_TASKS_COLLECTION_ID
        
        # Thread executor for blocking calls
        self.executor = ThreadPoolExecutor(max_workers=3)

    async def get_user_context(
        self, 
        user_email: str,
        include_events: bool = True,
        include_documents: bool = False,
        include_tasks: bool = False,
        event_ids: Optional[List[str]] = None,
        document_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Aggregate context for AI from user's data
        
        Args:
            user_email: User's email
            include_events: Include user's events
            include_documents: Include user's documents
            include_tasks: Include user's tasks
            event_ids: Specific event IDs to include
            document_ids: Specific document IDs to include
            
        Returns:
            Dictionary with aggregated context
        """
        context = {}
        
        try:
            # Get events
            if include_events:
                context['events'] = await self._get_events(user_email, event_ids)
            
            # Get documents
            if include_documents:
                context['documents'] = await self._get_documents(user_email, document_ids)
            
            # Get tasks
            if include_tasks:
                context['tasks'] = await self._get_tasks(user_email)
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting user context: {e}")
            return {}

    async def _get_events(
        self, 
        user_email: str, 
        event_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Get user's events"""
        try:
            queries = [Query.limit(10), Query.order_desc('startDate')]
            
            # If specific event IDs provided
            if event_ids:
                queries.append(Query.equal('$id', event_ids))
            else:
                # Get user's events
                queries.append(Query.equal('createdBy', user_email))
            
            # Run blocking Appwrite call in thread executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                self.executor,
                lambda: self.databases.list_documents(
                    self.database_id,
                    self.events_collection,
                    queries=queries
                )
            )
            
            return [
                {
                    'id': doc['$id'],
                    'title': doc.get('title', ''),
                    'description': doc.get('description', ''),
                    'startDate': doc.get('startDate', ''),
                    'endDate': doc.get('endDate', ''),
                    'location': doc.get('location', ''),
                    'status': doc.get('status', ''),
                }
                for doc in response.get('documents', response.get('rows', []))
            ]
            
        except Exception as e:
            logger.error(f"Error fetching events: {e}")
            return []

    async def _get_documents(
        self, 
        user_email: str,
        document_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Get user's documents"""
        try:
            queries = [Query.limit(5), Query.order_desc('$updatedAt')]
            
            # If specific document IDs provided
            if document_ids:
                queries.append(Query.equal('$id', document_ids))
            else:
                # Get user's documents or where user is collaborator
                queries.append(Query.equal('createdBy', user_email))
            
            # Run blocking Appwrite call in thread executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                self.executor,
                lambda: self.databases.list_documents(
                    self.database_id,
                    self.documents_collection,
                    queries=queries
                )
            )
            
            return [
                {
                    'id': doc['$id'],
                    'title': doc.get('title', ''),
                    'content': doc.get('content', '')[:1000],  # Limit content size
                }
                for doc in response.get('documents', response.get('rows', []))
            ]
            
        except Exception as e:
            logger.error(f"Error fetching documents: {e}")
            return []

    async def _get_tasks(self, user_email: str) -> List[Dict[str, Any]]:
        """Get user's tasks"""
        try:
            # Run blocking Appwrite call in thread executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                self.executor,
                lambda: self.databases.list_documents(
                    self.database_id,
                    self.tasks_collection,
                    queries=[
                        Query.equal('assignedTo', user_email),
                        Query.limit(10),
                        Query.order_desc('$createdAt')
                    ]
                )
            )
            
            return [
                {
                    'id': doc['$id'],
                    'title': doc.get('title', ''),
                    'status': doc.get('status', ''),
                    'priority': doc.get('priority', ''),
                    'dueDate': doc.get('dueDate', ''),
                }
                for doc in response.get('documents', response.get('rows', []))
            ]
            
        except Exception as e:
            logger.error(f"Error fetching tasks: {e}")
            return []


# Singleton instance
_context_service = None

def get_context_service() -> ContextService:
    """Get or create the Context service singleton"""
    global _context_service
    if _context_service is None:
        _context_service = ContextService()
    return _context_service
