"""
Documents API Routes
Handles all document collaboration operations
"""

import logging
from fastapi import APIRouter, HTTPException, Query as QueryParam
from typing import List, Optional
from datetime import datetime
from appwrite.query import Query
from appwrite.id import ID

from models.documents import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    InviteCreate,
    InviteResponse,
    InviteListResponse,
    PresenceCreate,
    PresenceResponse
)
from services.appwrite_service import get_appwrite_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Collection IDs
DOCUMENTS_COLLECTION = settings.APPWRITE_DOCUMENTS_COLLECTION_ID
INVITES_COLLECTION = settings.APPWRITE_INVITES_COLLECTION_ID
PRESENCE_COLLECTION = settings.APPWRITE_DOCUMENT_PRESENCE_COLLECTION_ID


# ============================================================================
# DOCUMENT CRUD ENDPOINTS
# ============================================================================

@router.post("/documents", response_model=DocumentResponse)
async def create_document(document: DocumentCreate, user_email: str = QueryParam(...)):
    """
    Create a new document
    """
    try:
        appwrite = get_appwrite_service()
        now = datetime.utcnow().isoformat()
        
        document_data = {
            "title": document.title,
            "content": document.content or '{"type":"doc","content":[]}',
            "createdBy": user_email,
            "createdAt": now,
            "updatedAt": now,
            "collaborators": document.collaborators or [],
            "isPublic": document.is_public,
        }
        
        result = appwrite.create_document(
            collection_id=DOCUMENTS_COLLECTION,
            data=document_data
        )
        
        logger.info(f"Created document: {result['$id']} by {user_email}")
        return DocumentResponse(**result)
        
    except Exception as e:
        logger.error(f"Error creating document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents", response_model=DocumentListResponse)
async def list_user_documents(user_email: str = QueryParam(...)):
    """
    List documents created by or shared with a user
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get documents created by user
        created_docs = appwrite.list_documents(
            collection_id=DOCUMENTS_COLLECTION,
            queries=[
                Query.equal('createdBy', user_email),
                Query.order_desc('updatedAt'),
                Query.limit(100)
            ]
        )
        
        # Get documents where user is a collaborator
        try:
            collab_docs = appwrite.list_documents(
                collection_id=DOCUMENTS_COLLECTION,
                queries=[
                    Query.contains('collaborators', [user_email]),
                    Query.order_desc('updatedAt'),
                    Query.limit(100)
                ]
            )
        except Exception as e:
            logger.warning(f"Error fetching collaborating documents: {e}")
            collab_docs = {'documents': [], 'total': 0}
        
        # Combine and deduplicate
        all_docs = created_docs['documents'] + collab_docs['documents']
        seen_ids = set()
        unique_docs = []
        for doc in all_docs:
            if doc['$id'] not in seen_ids:
                seen_ids.add(doc['$id'])
                unique_docs.append(doc)
        
        return DocumentListResponse(
            documents=[DocumentResponse(**doc) for doc in unique_docs],
            total=len(unique_docs)
        )
        
    except Exception as e:
        logger.error(f"Error listing documents for {user_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    """
    Get a single document by ID
    """
    try:
        appwrite = get_appwrite_service()
        
        result = appwrite.get_document(
            collection_id=DOCUMENTS_COLLECTION,
            document_id=document_id
        )
        
        return DocumentResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {e}")
        if "Document with the requested ID could not be found" in str(e):
            raise HTTPException(status_code=404, detail="Document not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(document_id: str, document: DocumentUpdate):
    """
    Update an existing document
    """
    try:
        appwrite = get_appwrite_service()
        
        # Only include fields that were provided
        update_data = document.model_dump(exclude_unset=True, by_alias=True)
        
        # Always update the updatedAt timestamp
        update_data['updatedAt'] = datetime.utcnow().isoformat()
        
        # Check content size limit (10MB = 10,485,760 characters)
        if 'content' in update_data and len(update_data['content']) > 10485760:
            raise HTTPException(status_code=400, detail="Content exceeds 10MB limit")
        
        result = appwrite.update_document(
            collection_id=DOCUMENTS_COLLECTION,
            document_id=document_id,
            data=update_data
        )
        
        logger.info(f"Updated document: {document_id}")
        return DocumentResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    user_email: str = QueryParam(...)
):
    """
    Delete a document (only by creator)
    """
    try:
        appwrite = get_appwrite_service()
        
        # Verify ownership
        doc = appwrite.get_document(
            collection_id=DOCUMENTS_COLLECTION,
            document_id=document_id
        )
        
        if doc.get('createdBy') != user_email:
            raise HTTPException(status_code=403, detail="Only the creator can delete this document")
        
        appwrite.delete_document(
            collection_id=DOCUMENTS_COLLECTION,
            document_id=document_id
        )
        
        logger.info(f"Deleted document: {document_id} by {user_email}")
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DOCUMENT COLLABORATION ENDPOINTS
# ============================================================================

@router.post("/documents/{document_id}/collaborators")
async def add_collaborator(
    document_id: str,
    email: str = QueryParam(...),
    user_email: str = QueryParam(...)
):
    """
    Add a collaborator to a document
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get document
        doc = appwrite.get_document(
            collection_id=DOCUMENTS_COLLECTION,
            document_id=document_id
        )
        
        # Check if user is owner or already a collaborator
        if doc.get('createdBy') != user_email and user_email not in doc.get('collaborators', []):
            raise HTTPException(status_code=403, detail="Not authorized to add collaborators")
        
        # Add collaborator if not already present
        collaborators = doc.get('collaborators', [])
        if email not in collaborators:
            collaborators.append(email)
            
            appwrite.update_document(
                collection_id=DOCUMENTS_COLLECTION,
                document_id=document_id,
                data={
                    'collaborators': collaborators,
                    'updatedAt': datetime.utcnow().isoformat()
                }
            )
        
        logger.info(f"Added collaborator {email} to document {document_id}")
        return {"message": "Collaborator added successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding collaborator: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}/collaborators/{email}")
async def remove_collaborator(
    document_id: str,
    email: str,
    user_email: str = QueryParam(...)
):
    """
    Remove a collaborator from a document
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get document
        doc = appwrite.get_document(
            collection_id=DOCUMENTS_COLLECTION,
            document_id=document_id
        )
        
        # Check if user is owner
        if doc.get('createdBy') != user_email:
            raise HTTPException(status_code=403, detail="Only the owner can remove collaborators")
        
        # Remove collaborator
        collaborators = doc.get('collaborators', [])
        if email in collaborators:
            collaborators.remove(email)
            
            appwrite.update_document(
                collection_id=DOCUMENTS_COLLECTION,
                document_id=document_id,
                data={
                    'collaborators': collaborators,
                    'updatedAt': datetime.utcnow().isoformat()
                }
            )
        
        logger.info(f"Removed collaborator {email} from document {document_id}")
        return {"message": "Collaborator removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing collaborator: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DOCUMENT INVITE ENDPOINTS
# ============================================================================

@router.post("/documents/invites", response_model=InviteResponse)
async def create_invite(invite: InviteCreate):
    """
    Create a document collaboration invite
    """
    try:
        appwrite = get_appwrite_service()
        now = datetime.utcnow().isoformat()
        token = ID.unique()
        
        invite_data = {
            "documentId": invite.document_id,
            "email": invite.email,
            "invitedBy": invite.invited_by,
            "invitedByName": invite.invited_by_name,
            "status": "pending",
            "token": token,
            "createdAt": now,
            "documentTitle": invite.document_title,
        }
        
        result = appwrite.create_document(
            collection_id=INVITES_COLLECTION,
            data=invite_data
        )
        
        logger.info(f"Created invite for {invite.email} to document {invite.document_id}")
        return InviteResponse(**result)
        
    except Exception as e:
        logger.error(f"Error creating invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/invites", response_model=InviteListResponse)
async def list_user_invites(user_email: str = QueryParam(...)):
    """
    List pending invites for a user
    """
    try:
        appwrite = get_appwrite_service()
        
        result = appwrite.list_documents(
            collection_id=INVITES_COLLECTION,
            queries=[
                Query.equal('email', user_email),
                Query.equal('status', 'pending'),
                Query.order_desc('createdAt'),
                Query.limit(100)
            ]
        )
        
        return InviteListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error listing invites for {user_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/documents/invites/{token}/accept")
async def accept_invite(token: str, user_email: str = QueryParam(...)):
    """
    Accept a document collaboration invite
    """
    try:
        appwrite = get_appwrite_service()
        
        # Find invite by token
        invites = appwrite.list_documents(
            collection_id=INVITES_COLLECTION,
            queries=[
                Query.equal('token', token),
                Query.limit(1)
            ]
        )
        
        if not invites['documents']:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        invite = invites['documents'][0]
        
        # Verify email matches
        if invite['email'] != user_email:
            raise HTTPException(status_code=403, detail="Invite not for this user")
        
        # Update invite status
        appwrite.update_document(
            collection_id=INVITES_COLLECTION,
            document_id=invite['$id'],
            data={
                'status': 'accepted',
                'respondedAt': datetime.utcnow().isoformat()
            }
        )
        
        # Add user as collaborator
        doc = appwrite.get_document(
            collection_id=DOCUMENTS_COLLECTION,
            document_id=invite['documentId']
        )
        
        collaborators = doc.get('collaborators', [])
        if user_email not in collaborators:
            collaborators.append(user_email)
            appwrite.update_document(
                collection_id=DOCUMENTS_COLLECTION,
                document_id=invite['documentId'],
                data={'collaborators': collaborators}
            )
        
        logger.info(f"Accepted invite for {user_email} to document {invite['documentId']}")
        return {"message": "Invite accepted", "documentId": invite['documentId']}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/documents/invites/{token}/reject")
async def reject_invite(token: str, user_email: str = QueryParam(...)):
    """
    Reject a document collaboration invite
    """
    try:
        appwrite = get_appwrite_service()
        
        # Find invite by token
        invites = appwrite.list_documents(
            collection_id=INVITES_COLLECTION,
            queries=[
                Query.equal('token', token),
                Query.limit(1)
            ]
        )
        
        if not invites['documents']:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        invite = invites['documents'][0]
        
        # Verify email matches
        if invite['email'] != user_email:
            raise HTTPException(status_code=403, detail="Invite not for this user")
        
        # Update invite status
        appwrite.update_document(
            collection_id=INVITES_COLLECTION,
            document_id=invite['$id'],
            data={
                'status': 'rejected',
                'respondedAt': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Rejected invite for {user_email} to document {invite['documentId']}")
        return {"message": "Invite rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))
