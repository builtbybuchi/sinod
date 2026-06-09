"""
Appwrite Service - Centralized Appwrite Database and Storage Operations
Provides reusable methods for all Appwrite interactions
"""

import logging
from typing import List, Dict, Any, Optional
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.tables_db import TablesDB
from appwrite.query import Query
from appwrite.id import ID
from config import settings

logger = logging.getLogger(__name__)


class AppwriteService:
    """Centralized service for Appwrite operations"""
    
    def __init__(self):
        """Initialize Appwrite client and services"""
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        
        self.databases = Databases(self.client)
        self.tables = TablesDB(self.client)
        self.storage = Storage(self.client)
        self.database_id = settings.APPWRITE_DATABASE_ID
    
    # ========================================================================
    # DATABASE OPERATIONS
    # ========================================================================
    
    def _normalize_list_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize Appwrite list responses to always use 'documents' key.
        Appwrite SDK v14 (TablesDB) returns 'rows' instead of 'documents'.
        This ensures backward compatibility with all downstream code.
        """
        if 'rows' in result and 'documents' not in result:
            result['documents'] = result.pop('rows')
        return result

    def list_documents(
        self,
        collection_id: str,
        queries: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        List documents from a collection
        
        Args:
            collection_id: The collection ID
            queries: Optional list of query strings
            
        Returns:
            Dictionary with 'documents' and 'total' keys
        """
        try:
            # Prefer new tables API to avoid deprecation warnings
            try:
                result = self.tables.list_rows(
                    database_id=self.database_id,
                    table_id=collection_id,
                    queries=queries or []
                )
            except Exception:
                # Fallback to legacy documents API for compatibility
                result = self.databases.list_documents(
                    database_id=self.database_id,
                    collection_id=collection_id,
                    queries=queries or []
                )
            return self._normalize_list_response(result)
        except Exception as e:
            logger.error(f"Error listing documents from {collection_id}: {e}")
            raise
    
    def get_document(
        self,
        collection_id: str,
        document_id: str
    ) -> Dict[str, Any]:
        """
        Get a single document by ID
        
        Args:
            collection_id: The collection ID
            document_id: The document ID
            
        Returns:
            Document data
        """
        try:
            try:
                document = self.tables.get_row(
                    database_id=self.database_id,
                    table_id=collection_id,
                    row_id=document_id
                )
            except Exception:
                document = self.databases.get_document(
                    database_id=self.database_id,
                    collection_id=collection_id,
                    document_id=document_id
                )
            return document
        except Exception as e:
            logger.error(f"Error getting document {document_id} from {collection_id}: {e}")
            raise
    
    def create_document(
        self,
        collection_id: str,
        data: Dict[str, Any],
        document_id: Optional[str] = None,
        permissions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create a new document
        
        Args:
            collection_id: The collection ID
            data: Document data
            document_id: Optional custom document ID
            permissions: Optional permissions array
            
        Returns:
            Created document
        """
        try:
            try:
                document = self.tables.create_row(
                    database_id=self.database_id,
                    table_id=collection_id,
                    row_id=document_id or ID.unique(),
                    data=data,
                    permissions=permissions
                )
            except Exception:
                document = self.databases.create_document(
                    database_id=self.database_id,
                    collection_id=collection_id,
                    document_id=document_id or ID.unique(),
                    data=data,
                    permissions=permissions
                )
            return document
        except Exception as e:
            logger.error(f"Error creating document in {collection_id}: {e}")
            raise
    
    def update_document(
        self,
        collection_id: str,
        document_id: str,
        data: Dict[str, Any],
        permissions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Update an existing document
        
        Args:
            collection_id: The collection ID
            document_id: The document ID
            data: Updated data
            permissions: Optional permissions array
            
        Returns:
            Updated document
        """
        try:
            try:
                document = self.tables.update_row(
                    database_id=self.database_id,
                    table_id=collection_id,
                    row_id=document_id,
                    data=data,
                    permissions=permissions
                )
            except Exception:
                document = self.databases.update_document(
                    database_id=self.database_id,
                    collection_id=collection_id,
                    document_id=document_id,
                    data=data,
                    permissions=permissions
                )
            return document
        except Exception as e:
            logger.error(f"Error updating document {document_id} in {collection_id}: {e}")
            raise
    
    def delete_document(
        self,
        collection_id: str,
        document_id: str
    ) -> None:
        """
        Delete a document
        
        Args:
            collection_id: The collection ID
            document_id: The document ID
        """
        try:
            try:
                self.tables.delete_row(
                    database_id=self.database_id,
                    table_id=collection_id,
                    row_id=document_id
                )
            except Exception:
                self.databases.delete_document(
                    database_id=self.database_id,
                    collection_id=collection_id,
                    document_id=document_id
                )
        except Exception as e:
            logger.error(f"Error deleting document {document_id} from {collection_id}: {e}")
            raise
    
    # ========================================================================
    # STORAGE OPERATIONS
    # ========================================================================
    
    def upload_file(
        self,
        bucket_id: str,
        file_id: str,
        file_data: bytes,
        permissions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Upload a file to storage
        
        Args:
            bucket_id: The bucket ID
            file_id: The file ID
            file_data: File bytes
            permissions: Optional permissions array
            
        Returns:
            File metadata
        """
        try:
            file = self.storage.create_file(
                bucket_id=bucket_id,
                file_id=file_id,
                file=file_data,
                permissions=permissions
            )
            return file
        except Exception as e:
            logger.error(f"Error uploading file to {bucket_id}: {e}")
            raise
    
    def get_file(
        self,
        bucket_id: str,
        file_id: str
    ) -> Dict[str, Any]:
        """
        Get file metadata
        
        Args:
            bucket_id: The bucket ID
            file_id: The file ID
            
        Returns:
            File metadata
        """
        try:
            file = self.storage.get_file(
                bucket_id=bucket_id,
                file_id=file_id
            )
            return file
        except Exception as e:
            logger.error(f"Error getting file {file_id} from {bucket_id}: {e}")
            raise
    
    def get_file_view_url(
        self,
        bucket_id: str,
        file_id: str
    ) -> str:
        """
        Get file view URL
        
        Args:
            bucket_id: The bucket ID
            file_id: The file ID
            
        Returns:
            File view URL
        """
        try:
            result = self.storage.get_file_view(
                bucket_id=bucket_id,
                file_id=file_id
            )
            return str(result)
        except Exception as e:
            logger.error(f"Error getting file view URL for {file_id}: {e}")
            raise
    
    def get_file_download_url(
        self,
        bucket_id: str,
        file_id: str
    ) -> str:
        """
        Get file download URL
        
        Args:
            bucket_id: The bucket ID
            file_id: The file ID
            
        Returns:
            File download URL
        """
        try:
            result = self.storage.get_file_download(
                bucket_id=bucket_id,
                file_id=file_id
            )
            return str(result)
        except Exception as e:
            logger.error(f"Error getting file download URL for {file_id}: {e}")
            raise
    
    def delete_file(
        self,
        bucket_id: str,
        file_id: str
    ) -> None:
        """
        Delete a file
        
        Args:
            bucket_id: The bucket ID
            file_id: The file ID
        """
        try:
            self.storage.delete_file(
                bucket_id=bucket_id,
                file_id=file_id
            )
        except Exception as e:
            logger.error(f"Error deleting file {file_id} from {bucket_id}: {e}")
            raise


# Singleton instance
_appwrite_service = None


def get_appwrite_service() -> AppwriteService:
    """Get or create the Appwrite service singleton"""
    global _appwrite_service
    if _appwrite_service is None:
        _appwrite_service = AppwriteService()
    return _appwrite_service
