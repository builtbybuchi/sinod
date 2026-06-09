"""
Whiteboards API Routes
Handles all whiteboard collaboration operations
"""

import logging
from fastapi import APIRouter, HTTPException, Query as QueryParam
from typing import List, Optional
from datetime import datetime, timedelta
from appwrite.query import Query
from appwrite.id import ID

from models.whiteboards import (
    WhiteboardCreate,
    WhiteboardUpdate,
    WhiteboardResponse,
    WhiteboardListResponse,
    WhiteboardInviteCreate,
    WhiteboardInviteResponse,
    WhiteboardInviteListResponse,
    WhiteboardPresenceCreate,
    WhiteboardPresenceResponse
)
from services.appwrite_service import get_appwrite_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Collection IDs
WHITEBOARDS_COLLECTION = settings.APPWRITE_WHITEBOARDS_COLLECTION_ID
INVITES_COLLECTION = settings.APPWRITE_WHITEBOARD_INVITES_COLLECTION_ID
PRESENCE_COLLECTION = settings.APPWRITE_WHITEBOARD_PRESENCE_COLLECTION_ID


# ============================================================================
# WHITEBOARD CRUD ENDPOINTS
# ============================================================================

@router.post("/whiteboards", response_model=WhiteboardResponse)
async def create_whiteboard(whiteboard: WhiteboardCreate, user_email: str = QueryParam(...)):
    """
    Create a new whiteboard
    """
    try:
        appwrite = get_appwrite_service()
        now = datetime.utcnow().isoformat()
        
        whiteboard_data = {
            "title": whiteboard.title,
            "content": whiteboard.content or '{"elements":[],"appState":{}}',
            "createdBy": user_email,
            "createdAt": now,
            "updatedAt": now,
            "collaborators": whiteboard.collaborators or [],
            "isPublic": whiteboard.is_public,
        }
        
        result = appwrite.create_document(
            collection_id=WHITEBOARDS_COLLECTION,
            data=whiteboard_data
        )
        
        logger.info(f"Created whiteboard: {result['$id']} by {user_email}")
        return WhiteboardResponse(**result)
        
    except Exception as e:
        logger.error(f"Error creating whiteboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/whiteboards", response_model=WhiteboardListResponse)
async def list_user_whiteboards(user_email: str = QueryParam(...)):
    """
    List whiteboards created by or shared with a user
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get whiteboards created by user
        created_wbs = appwrite.list_documents(
            collection_id=WHITEBOARDS_COLLECTION,
            queries=[
                Query.equal('createdBy', user_email),
                Query.order_desc('updatedAt'),
                Query.limit(100)
            ]
        )
        
        # Get whiteboards where user is a collaborator
        try:
            collab_wbs = appwrite.list_documents(
                collection_id=WHITEBOARDS_COLLECTION,
                queries=[
                    Query.contains('collaborators', [user_email]),
                    Query.order_desc('updatedAt'),
                    Query.limit(100)
                ]
            )
        except Exception as e:
            logger.warning(f"Error fetching collaborating whiteboards: {e}")
            collab_wbs = {'documents': [], 'total': 0}
        
        # Combine and deduplicate
        all_wbs = created_wbs['documents'] + collab_wbs['documents']
        seen_ids = set()
        unique_wbs = []
        for wb in all_wbs:
            if wb['$id'] not in seen_ids:
                seen_ids.add(wb['$id'])
                unique_wbs.append(wb)
        
        return WhiteboardListResponse(
            documents=[WhiteboardResponse(**wb) for wb in unique_wbs],
            total=len(unique_wbs)
        )
        
    except Exception as e:
        logger.error(f"Error listing whiteboards for {user_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/whiteboards/{whiteboard_id}", response_model=WhiteboardResponse)
async def get_whiteboard(whiteboard_id: str):
    """
    Get a single whiteboard by ID
    """
    try:
        appwrite = get_appwrite_service()
        
        result = appwrite.get_document(
            collection_id=WHITEBOARDS_COLLECTION,
            document_id=whiteboard_id
        )
        
        return WhiteboardResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting whiteboard {whiteboard_id}: {e}")
        if "Document with the requested ID could not be found" in str(e):
            raise HTTPException(status_code=404, detail="Whiteboard not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/whiteboards/{whiteboard_id}", response_model=WhiteboardResponse)
async def update_whiteboard(whiteboard_id: str, whiteboard: WhiteboardUpdate):
    """
    Update an existing whiteboard
    """
    try:
        appwrite = get_appwrite_service()
        
        # Only include fields that were provided
        update_data = whiteboard.model_dump(exclude_unset=True, by_alias=True)
        
        # Always update the updatedAt timestamp
        update_data['updatedAt'] = datetime.utcnow().isoformat()
        
        # Check content size limit (50MB = 52,428,800 characters for whiteboards)
        if 'content' in update_data and len(update_data['content']) > 52428800:
            raise HTTPException(status_code=400, detail="Content exceeds 50MB limit")
        
        result = appwrite.update_document(
            collection_id=WHITEBOARDS_COLLECTION,
            document_id=whiteboard_id,
            data=update_data
        )
        
        logger.info(f"Updated whiteboard: {whiteboard_id}")
        return WhiteboardResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating whiteboard {whiteboard_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/whiteboards/{whiteboard_id}")
async def delete_whiteboard(
    whiteboard_id: str,
    user_email: str = QueryParam(...)
):
    """
    Delete a whiteboard (only by creator)
    """
    try:
        appwrite = get_appwrite_service()
        
        # Verify ownership
        wb = appwrite.get_document(
            collection_id=WHITEBOARDS_COLLECTION,
            document_id=whiteboard_id
        )
        
        if wb.get('createdBy') != user_email:
            raise HTTPException(status_code=403, detail="Only the creator can delete this whiteboard")
        
        appwrite.delete_document(
            collection_id=WHITEBOARDS_COLLECTION,
            document_id=whiteboard_id
        )
        
        logger.info(f"Deleted whiteboard: {whiteboard_id} by {user_email}")
        return {"message": "Whiteboard deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting whiteboard {whiteboard_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WHITEBOARD COLLABORATION ENDPOINTS
# ============================================================================

@router.post("/whiteboards/{whiteboard_id}/collaborators")
async def add_collaborator(
    whiteboard_id: str,
    email: str = QueryParam(...),
    user_email: str = QueryParam(...)
):
    """
    Add a collaborator to a whiteboard
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get whiteboard
        wb = appwrite.get_document(
            collection_id=WHITEBOARDS_COLLECTION,
            document_id=whiteboard_id
        )
        
        # Check if user is owner or already a collaborator
        if wb.get('createdBy') != user_email and user_email not in wb.get('collaborators', []):
            raise HTTPException(status_code=403, detail="Not authorized to add collaborators")
        
        # Add collaborator if not already present
        collaborators = wb.get('collaborators', [])
        if email not in collaborators:
            collaborators.append(email)
            
            appwrite.update_document(
                collection_id=WHITEBOARDS_COLLECTION,
                document_id=whiteboard_id,
                data={
                    'collaborators': collaborators,
                    'updatedAt': datetime.utcnow().isoformat()
                }
            )
        
        logger.info(f"Added collaborator {email} to whiteboard {whiteboard_id}")
        return {"message": "Collaborator added successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding collaborator: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/whiteboards/{whiteboard_id}/collaborators/{email}")
async def remove_collaborator(
    whiteboard_id: str,
    email: str,
    user_email: str = QueryParam(...)
):
    """
    Remove a collaborator from a whiteboard
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get whiteboard
        wb = appwrite.get_document(
            collection_id=WHITEBOARDS_COLLECTION,
            document_id=whiteboard_id
        )
        
        # Check if user is owner
        if wb.get('createdBy') != user_email:
            raise HTTPException(status_code=403, detail="Only the owner can remove collaborators")
        
        # Remove collaborator
        collaborators = wb.get('collaborators', [])
        if email in collaborators:
            collaborators.remove(email)
            
            appwrite.update_document(
                collection_id=WHITEBOARDS_COLLECTION,
                document_id=whiteboard_id,
                data={
                    'collaborators': collaborators,
                    'updatedAt': datetime.utcnow().isoformat()
                }
            )
        
        logger.info(f"Removed collaborator {email} from whiteboard {whiteboard_id}")
        return {"message": "Collaborator removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing collaborator: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WHITEBOARD INVITE ENDPOINTS
# ============================================================================

@router.post("/whiteboards/invites", response_model=WhiteboardInviteResponse)
async def create_invite(invite: WhiteboardInviteCreate):
    """
    Create a whiteboard collaboration invite
    """
    try:
        appwrite = get_appwrite_service()
        now = datetime.utcnow()
        token = ID.unique()
        expires_at = (now + timedelta(days=7)).isoformat()  # Invite expires in 7 days
        
        invite_data = {
            "whiteboardId": invite.whiteboard_id,
            "email": invite.email,
            "invitedBy": invite.invited_by,
            "status": "pending",
            "token": token,
            "createdAt": now.isoformat(),
            "expiresAt": expires_at,
        }
        
        result = appwrite.create_document(
            collection_id=INVITES_COLLECTION,
            data=invite_data
        )
        
        logger.info(f"Created invite for {invite.email} to whiteboard {invite.whiteboard_id}")
        return WhiteboardInviteResponse(**result)
        
    except Exception as e:
        logger.error(f"Error creating invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/whiteboards/invites", response_model=WhiteboardInviteListResponse)
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
        
        return WhiteboardInviteListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error listing invites for {user_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/whiteboards/invites/{token}/accept")
async def accept_invite(token: str, user_email: str = QueryParam(...)):
    """
    Accept a whiteboard collaboration invite
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
        
        # Check if expired
        if datetime.fromisoformat(invite['expiresAt']) < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invite has expired")
        
        # Verify email matches
        if invite['email'] != user_email:
            raise HTTPException(status_code=403, detail="Invite not for this user")
        
        # Update invite status
        appwrite.update_document(
            collection_id=INVITES_COLLECTION,
            document_id=invite['$id'],
            data={'status': 'accepted'}
        )
        
        # Add user as collaborator
        wb = appwrite.get_document(
            collection_id=WHITEBOARDS_COLLECTION,
            document_id=invite['whiteboardId']
        )
        
        collaborators = wb.get('collaborators', [])
        if user_email not in collaborators:
            collaborators.append(user_email)
            appwrite.update_document(
                collection_id=WHITEBOARDS_COLLECTION,
                document_id=invite['whiteboardId'],
                data={'collaborators': collaborators}
            )
        
        logger.info(f"Accepted invite for {user_email} to whiteboard {invite['whiteboardId']}")
        return {"message": "Invite accepted", "whiteboardId": invite['whiteboardId']}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/whiteboards/invites/{token}/reject")
async def reject_invite(token: str, user_email: str = QueryParam(...)):
    """
    Reject a whiteboard collaboration invite
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
            data={'status': 'rejected'}
        )
        
        logger.info(f"Rejected invite for {user_email} to whiteboard {invite['whiteboardId']}")
        return {"message": "Invite rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))
