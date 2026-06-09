"""
Chat Routes
Handles all chat-related endpoints for conversations and messages
"""

from fastapi import APIRouter, HTTPException, Query as QueryParam
from appwrite.query import Query
from appwrite.id import ID
from datetime import datetime
import logging
import json
from typing import List, Optional

from models.chat import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationListResponse,
    MessageCreate,
    MessageUpdate,
    MessageResponse,
    MessageListResponse,
    ParticipantAdd,
    ParticipantRemove,
    MarkAsReadParams,
)
from services.appwrite_service import get_appwrite_service
from services.websocket_manager import connection_manager
from config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Collection IDs
CONVERSATIONS_COLLECTION = settings.APPWRITE_CONVERSATIONS_COLLECTION_ID
MESSAGES_COLLECTION = settings.APPWRITE_MESSAGES_COLLECTION_ID


# ============================================================================
# CONVERSATION ENDPOINTS
# ============================================================================

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(conversation: ConversationCreate):
    """
    Create a new conversation (direct or group)
    """
    try:
        appwrite = get_appwrite_service()
        now = datetime.utcnow().isoformat()
        
        # For direct conversations, check if it already exists
        if conversation.type == "direct" and len(conversation.participants) == 2:
            existing = appwrite.list_documents(
                collection_id=CONVERSATIONS_COLLECTION,
                queries=[
                    Query.equal('type', 'direct'),
                    Query.contains('participants', [conversation.participants[0]]),
                    Query.contains('participants', [conversation.participants[1]]),
                    Query.limit(1)
                ]
            )
            
            if existing.get('documents'):
                # Return existing conversation
                return ConversationResponse(**existing['documents'][0])
        
        # Create new conversation
        doc = appwrite.create_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=ID.unique(),
            data={
                'type': conversation.type,
                'name': conversation.name,
                'description': conversation.description,
                'avatarUrl': conversation.avatar_url,
                'participants': conversation.participants,
                'participantNames': conversation.participant_names,
                'participantAvatars': conversation.participant_avatars or [],
                'createdBy': conversation.created_by,
                'createdAt': now,
                'updatedAt': now,
                'lastMessage': None,
                'lastMessageBy': None,
                'lastMessageAt': None,
                'unreadCounts': json.dumps({})  # Empty unread counts
            }
        )
        
        logger.info(f"Created conversation {doc['$id']}")
        return ConversationResponse(**doc)
        
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(user_email: str = QueryParam(...)):
    """
    List all conversations for a user
    """
    try:
        appwrite = get_appwrite_service()
        
        result = appwrite.list_documents(
            collection_id=CONVERSATIONS_COLLECTION,
            queries=[
                Query.contains('participants', [user_email]),
                Query.order_desc('updatedAt'),
                Query.limit(100)
            ]
        )
        
        return ConversationListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error listing conversations for {user_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str):
    """
    Get a single conversation by ID
    """
    try:
        appwrite = get_appwrite_service()
        
        doc = appwrite.get_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=conversation_id
        )
        
        return ConversationResponse(**doc)
        
    except Exception as e:
        logger.error(f"Error getting conversation {conversation_id}: {e}")
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    update_data: ConversationUpdate,
    user_email: str = QueryParam(...)
):
    """
    Update conversation details (name, description, avatar)
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get conversation to verify user is a participant
        conv = appwrite.get_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=conversation_id
        )
        
        if user_email not in conv.get('participants', []):
            raise HTTPException(status_code=403, detail="Not a participant")
        
        # Build update data
        update_dict = {}
        if update_data.name is not None:
            update_dict['name'] = update_data.name
        if update_data.description is not None:
            update_dict['description'] = update_data.description
        if update_data.avatar_url is not None:
            update_dict['avatarUrl'] = update_data.avatar_url
        
        update_dict['updatedAt'] = datetime.utcnow().isoformat()
        
        # Update conversation
        doc = appwrite.update_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=conversation_id,
            data=update_dict
        )
        
        logger.info(f"Updated conversation {conversation_id}")
        return ConversationResponse(**doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation {conversation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_email: str = QueryParam(...)
):
    """
    Delete a conversation (only creator can delete)
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get conversation to verify user is the creator
        conv = appwrite.get_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=conversation_id
        )
        
        if conv.get('createdBy') != user_email:
            raise HTTPException(status_code=403, detail="Only the creator can delete this conversation")
        
        # Delete all messages in the conversation first
        messages = appwrite.list_documents(
            collection_id=MESSAGES_COLLECTION,
            queries=[
                Query.equal('conversationId', conversation_id),
                Query.limit(1000)
            ]
        )
        
        for msg in messages.get('documents', []):
            appwrite.delete_document(
                collection_id=MESSAGES_COLLECTION,
                document_id=msg['$id']
            )
        
        # Delete conversation
        appwrite.delete_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=conversation_id
        )
        
        logger.info(f"Deleted conversation {conversation_id}")
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation {conversation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PARTICIPANT MANAGEMENT
# ============================================================================

@router.post("/conversations/{conversation_id}/participants")
async def add_participants(
    conversation_id: str,
    participant_data: ParticipantAdd,
    user_email: str = QueryParam(...)
):
    """
    Add participants to a group conversation
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get conversation
        conv = appwrite.get_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=conversation_id
        )
        
        # Verify it's a group conversation
        if conv.get('type') != 'group':
            raise HTTPException(status_code=400, detail="Can only add participants to group conversations")
        
        # Verify user is a participant
        if user_email not in conv.get('participants', []):
            raise HTTPException(status_code=403, detail="Not a participant")
        
        # Add new participants
        participants = conv.get('participants', [])
        participant_names = conv.get('participantNames', [])
        participant_avatars = conv.get('participantAvatars', [])
        
        for i, email in enumerate(participant_data.emails):
            if email not in participants:
                participants.append(email)
                participant_names.append(participant_data.names[i])
                if participant_data.avatars and i < len(participant_data.avatars):
                    participant_avatars.append(participant_data.avatars[i])
        
        # Update conversation
        appwrite.update_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=conversation_id,
            data={
                'participants': participants,
                'participantNames': participant_names,
                'participantAvatars': participant_avatars,
                'updatedAt': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Added participants to conversation {conversation_id}")
        return {"message": "Participants added successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding participants: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}/participants")
async def remove_participant(
    conversation_id: str,
    participant_email: str = QueryParam(...),
    user_email: str = QueryParam(...)
):
    """
    Remove a participant from a group conversation
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get conversation
        conv = appwrite.get_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=conversation_id
        )
        
        # Verify it's a group conversation
        if conv.get('type') != 'group':
            raise HTTPException(status_code=400, detail="Can only remove participants from group conversations")
        
        # Only creator or the participant themselves can remove
        if user_email != conv.get('createdBy') and user_email != participant_email:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Remove participant
        participants = conv.get('participants', [])
        participant_names = conv.get('participantNames', [])
        participant_avatars = conv.get('participantAvatars', [])
        
        if participant_email in participants:
            idx = participants.index(participant_email)
            participants.pop(idx)
            if idx < len(participant_names):
                participant_names.pop(idx)
            if idx < len(participant_avatars):
                participant_avatars.pop(idx)
        
        # Update conversation
        appwrite.update_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=conversation_id,
            data={
                'participants': participants,
                'participantNames': participant_names,
                'participantAvatars': participant_avatars,
                'updatedAt': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Removed participant {participant_email} from conversation {conversation_id}")
        return {"message": "Participant removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing participant: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MESSAGE ENDPOINTS
# ============================================================================

@router.post("/messages", response_model=MessageResponse)
async def create_message(message: MessageCreate):
    """
    Send a new message in a conversation
    """
    try:
        appwrite = get_appwrite_service()
        now = datetime.utcnow().isoformat()
        
        # Create message
        doc = appwrite.create_document(
            collection_id=MESSAGES_COLLECTION,
            document_id=ID.unique(),
            data={
                'conversationId': message.conversation_id,
                'senderId': message.sender_id,
                'senderName': message.sender_name,
                'senderAvatar': message.sender_avatar,
                'content': message.content,
                'type': message.type,
                'attachmentUrl': message.attachment_url,
                'attachmentName': message.attachment_name,
                'attachmentSize': message.attachment_size,
                'createdAt': now,
                'updatedAt': now,
                'isEdited': False,
                'readBy': [message.sender_id],  # Sender has read it
                'replyTo': message.reply_to
            }
        )
        
        # Update conversation's last message
        appwrite.update_document(
            collection_id=CONVERSATIONS_COLLECTION,
            document_id=message.conversation_id,
            data={
                'lastMessage': message.content[:100],  # Preview
                'lastMessageBy': message.sender_id,
                'lastMessageAt': now,
                'updatedAt': now
            }
        )
        
        logger.info(f"Created message {doc['$id']} in conversation {message.conversation_id}")
        
        # Broadcast new message to all connected users in this conversation
        await connection_manager.broadcast_new_message(
            message.conversation_id,
            doc
        )
        
        return MessageResponse(**doc)
        
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages", response_model=MessageListResponse)
async def list_messages(
    conversation_id: str = QueryParam(...),
    limit: int = QueryParam(50),
    offset: int = QueryParam(0)
):
    """
    List messages in a conversation (paginated)
    """
    try:
        appwrite = get_appwrite_service()
        
        result = appwrite.list_documents(
            collection_id=MESSAGES_COLLECTION,
            queries=[
                Query.equal('conversationId', conversation_id),
                Query.order_desc('createdAt'),
                Query.limit(limit),
                Query.offset(offset)
            ]
        )
        
        return MessageListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error listing messages for conversation {conversation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages/{message_id}", response_model=MessageResponse)
async def get_message(message_id: str):
    """
    Get a single message by ID
    """
    try:
        appwrite = get_appwrite_service()
        
        doc = appwrite.get_document(
            collection_id=MESSAGES_COLLECTION,
            document_id=message_id
        )
        
        return MessageResponse(**doc)
        
    except Exception as e:
        logger.error(f"Error getting message {message_id}: {e}")
        raise HTTPException(status_code=404, detail="Message not found")


@router.put("/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: str,
    update_data: MessageUpdate,
    user_email: str = QueryParam(...)
):
    """
    Update a message (edit content)
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get message to verify user is the sender
        msg = appwrite.get_document(
            collection_id=MESSAGES_COLLECTION,
            document_id=message_id
        )
        
        if msg.get('senderId') != user_email:
            raise HTTPException(status_code=403, detail="Can only edit your own messages")
        
        # Update message
        update_dict = {
            'updatedAt': datetime.utcnow().isoformat(),
            'isEdited': True
        }
        
        if update_data.content is not None:
            update_dict['content'] = update_data.content
        
        doc = appwrite.update_document(
            collection_id=MESSAGES_COLLECTION,
            document_id=message_id,
            data=update_dict
        )
        
        logger.info(f"Updated message {message_id}")
        
        # Broadcast message update to all connected users
        await connection_manager.broadcast_message_updated(
            msg.get('conversationId'),
            doc
        )
        
        return MessageResponse(**doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating message {message_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    user_email: str = QueryParam(...)
):
    """
    Delete a message
    """
    try:
        appwrite = get_appwrite_service()
        
        # Get message to verify user is the sender
        msg = appwrite.get_document(
            collection_id=MESSAGES_COLLECTION,
            document_id=message_id
        )
        
        if msg.get('senderId') != user_email:
            raise HTTPException(status_code=403, detail="Can only delete your own messages")
        
        # Store conversation ID before deletion
        conversation_id = msg.get('conversationId')
        
        # Delete message
        appwrite.delete_document(
            collection_id=MESSAGES_COLLECTION,
            document_id=message_id
        )
        
        logger.info(f"Deleted message {message_id}")
        
        # Broadcast message deletion to all connected users
        await connection_manager.broadcast_message_deleted(
            conversation_id,
            message_id
        )
        
        return {"message": "Message deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message {message_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/messages/mark-read")
async def mark_messages_as_read(params: MarkAsReadParams):
    """
    Mark multiple messages as read by a user
    """
    try:
        appwrite = get_appwrite_service()
        
        for message_id in params.message_ids:
            try:
                # Get message
                msg = appwrite.get_document(
                    collection_id=MESSAGES_COLLECTION,
                    document_id=message_id
                )
                
                # Add user to readBy if not already there
                read_by = msg.get('readBy', [])
                if params.user_email not in read_by:
                    read_by.append(params.user_email)
                    
                    appwrite.update_document(
                        collection_id=MESSAGES_COLLECTION,
                        document_id=message_id,
                        data={'readBy': read_by}
                    )
            except Exception as e:
                logger.warning(f"Failed to mark message {message_id} as read: {e}")
                continue
        
        logger.info(f"Marked {len(params.message_ids)} messages as read for {params.user_email}")
        return {"message": "Messages marked as read"}
        
    except Exception as e:
        logger.error(f"Error marking messages as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/search")
async def search_messages(
    conversation_id: str,
    query: str = QueryParam(...),
    limit: int = QueryParam(20)
):
    """
    Search messages in a conversation
    """
    try:
        appwrite = get_appwrite_service()
        
        result = appwrite.list_documents(
            collection_id=MESSAGES_COLLECTION,
            queries=[
                Query.equal('conversationId', conversation_id),
                Query.search('content', query),
                Query.order_desc('createdAt'),
                Query.limit(limit)
            ]
        )
        
        return MessageListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error searching messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))
