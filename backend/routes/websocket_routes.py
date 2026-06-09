"""
WebSocket Routes for Real-time Chat

Handles WebSocket connections, message routing, and real-time updates.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from services.websocket_manager import connection_manager
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/chat/{user_email}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    user_email: str
):
    """
    WebSocket endpoint for real-time chat updates.
    
    Client connects with their email and can:
    - Subscribe to conversations
    - Receive new messages
    - Send typing indicators
    - Get presence updates
    
    Message Format (Client -> Server):
    {
        "type": "subscribe" | "unsubscribe" | "typing",
        "conversation_id": "...",
        "is_typing": true/false  (for typing messages)
    }
    
    Message Format (Server -> Client):
    {
        "type": "new_message" | "message_updated" | "message_deleted" | 
                "typing_indicator" | "user_joined" | "user_left" | 
                "conversation_updated",
        "conversation_id": "...",
        "message": {...},  (for message events)
        "timestamp": "..."
    }
    """
    
    # Connect the user
    await connection_manager.connect(websocket, user_email)
    
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                logger.debug(f"📨 Received from {user_email}: {message_type}")
                
                # Handle different message types
                if message_type == "subscribe":
                    # Subscribe to a conversation
                    conversation_id = message.get("conversation_id")
                    if conversation_id:
                        await connection_manager.subscribe_to_conversation(
                            user_email, 
                            conversation_id
                        )
                        logger.debug(f"✅ {user_email} subscribed to {conversation_id}")
                    else:
                        await connection_manager.send_to_user(user_email, {
                            "type": "error",
                            "message": "Missing conversation_id"
                        })
                
                elif message_type == "unsubscribe":
                    # Unsubscribe from a conversation
                    conversation_id = message.get("conversation_id")
                    if conversation_id:
                        await connection_manager.unsubscribe_from_conversation(
                            user_email, 
                            conversation_id
                        )
                        logger.debug(f"🔕 {user_email} unsubscribed from {conversation_id}")
                    else:
                        await connection_manager.send_to_user(user_email, {
                            "type": "error",
                            "message": "Missing conversation_id"
                        })
                
                elif message_type == "typing":
                    # Typing indicator
                    conversation_id = message.get("conversation_id")
                    is_typing = message.get("is_typing", False)
                    
                    if conversation_id is not None:
                        await connection_manager.broadcast_typing_indicator(
                            conversation_id,
                            user_email,
                            is_typing
                        )
                        logger.debug(f"⌨️  {user_email} typing in {conversation_id}: {is_typing}")
                    else:
                        await connection_manager.send_to_user(user_email, {
                            "type": "error",
                            "message": "Missing conversation_id for typing indicator"
                        })
                
                elif message_type == "ping":
                    # Heartbeat
                    await connection_manager.send_to_user(user_email, {
                        "type": "pong"
                    })
                
                elif message_type == "get_online_users":
                    # Get list of online users in a conversation
                    conversation_id = message.get("conversation_id")
                    if conversation_id:
                        online_users = connection_manager.get_online_users(conversation_id)
                        await connection_manager.send_to_user(user_email, {
                            "type": "online_users",
                            "conversation_id": conversation_id,
                            "users": online_users
                        })
                
                else:
                    # Unknown message type
                    await connection_manager.send_to_user(user_email, {
                        "type": "error",
                        "message": f"Unknown message type: {message_type}"
                    })
            
            except json.JSONDecodeError:
                logger.error(f"❌ Invalid JSON from {user_email}: {data}")
                await connection_manager.send_to_user(user_email, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            
            except Exception as e:
                logger.error(f"❌ Error processing message from {user_email}: {e}")
                await connection_manager.send_to_user(user_email, {
                    "type": "error",
                    "message": str(e)
                })
    
    except WebSocketDisconnect:
        # Clean disconnect
        logger.debug(f"🔌 WebSocket disconnected: {user_email}")
        connection_manager.disconnect(user_email)
    
    except Exception as e:
        # Unexpected error
        logger.error(f"❌ WebSocket error for {user_email}: {e}")
        connection_manager.disconnect(user_email)


@router.get("/ws/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return connection_manager.get_stats()
