"""
WebSocket Connection Manager for Real-time Chat

Manages WebSocket connections, subscriptions to conversations,
and broadcasting messages to connected clients.
"""

from fastapi import WebSocket
from typing import Dict, Set, List, Optional
import logging
import json
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time chat functionality.
    
    Features:
    - User connection management
    - Conversation subscriptions
    - Message broadcasting
    - Typing indicators
    - Presence tracking
    """
    
    def __init__(self):
        # Map of user_email -> WebSocket connection
        self.user_connections: Dict[str, WebSocket] = {}
        
        # Map of conversation_id -> set of user emails subscribed
        self.conversation_subscribers: Dict[str, Set[str]] = {}
        
        # Map of user_email -> set of conversation_ids they're subscribed to
        self.user_subscriptions: Dict[str, Set[str]] = {}
        
        # Typing status: conversation_id -> {user_email: timestamp}
        self.typing_status: Dict[str, Dict[str, datetime]] = {}
    
    async def connect(self, websocket: WebSocket, user_email: str):
        """Accept a WebSocket connection and register the user"""
        await websocket.accept()
        self.user_connections[user_email] = websocket
        logger.debug(f"✅ User connected: {user_email} (Total: {len(self.user_connections)})")
        
        # Send welcome message
        await self.send_to_user(user_email, {
            "type": "connected",
            "message": "WebSocket connected successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    def disconnect(self, user_email: str):
        """Disconnect a user and clean up their subscriptions"""
        if user_email in self.user_connections:
            # Remove from all conversation subscriptions
            if user_email in self.user_subscriptions:
                for conv_id in self.user_subscriptions[user_email]:
                    if conv_id in self.conversation_subscribers:
                        self.conversation_subscribers[conv_id].discard(user_email)
                        
                        # Broadcast user left
                        self._broadcast_to_conversation_sync(conv_id, {
                            "type": "user_left",
                            "user_email": user_email,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        })
                
                del self.user_subscriptions[user_email]
            
            # Remove connection
            del self.user_connections[user_email]
            logger.debug(f"❌ User disconnected: {user_email} (Total: {len(self.user_connections)})")
    
    async def subscribe_to_conversation(self, user_email: str, conversation_id: str):
        """Subscribe a user to a conversation for real-time updates"""
        if user_email not in self.user_connections:
            logger.warning(f"⚠️ Cannot subscribe {user_email} - not connected")
            return
        
        # Add to conversation subscribers
        if conversation_id not in self.conversation_subscribers:
            self.conversation_subscribers[conversation_id] = set()
        self.conversation_subscribers[conversation_id].add(user_email)
        
        # Add to user subscriptions
        if user_email not in self.user_subscriptions:
            self.user_subscriptions[user_email] = set()
        self.user_subscriptions[user_email].add(conversation_id)
        
        logger.debug(f"📡 {user_email} subscribed to conversation {conversation_id}")
        
        # Confirm subscription
        await self.send_to_user(user_email, {
            "type": "subscribed",
            "conversation_id": conversation_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Notify other users in the conversation
        await self.broadcast_to_conversation(
            conversation_id,
            {
                "type": "user_joined",
                "user_email": user_email,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            exclude_user=user_email
        )
    
    async def unsubscribe_from_conversation(self, user_email: str, conversation_id: str):
        """Unsubscribe a user from a conversation"""
        if conversation_id in self.conversation_subscribers:
            self.conversation_subscribers[conversation_id].discard(user_email)
        
        if user_email in self.user_subscriptions:
            self.user_subscriptions[user_email].discard(conversation_id)
        
        logger.info(f"🔕 {user_email} unsubscribed from conversation {conversation_id}")
        
        # Notify others
        await self.broadcast_to_conversation(
            conversation_id,
            {
                "type": "user_left",
                "user_email": user_email,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
    
    async def broadcast_to_conversation(
        self, 
        conversation_id: str, 
        message: dict,
        exclude_user: Optional[str] = None
    ):
        """Broadcast a message to all users subscribed to a conversation"""
        if conversation_id not in self.conversation_subscribers:
            logger.debug(f"No subscribers for conversation {conversation_id}")
            return
        
        subscribers = self.conversation_subscribers[conversation_id].copy()
        if exclude_user:
            subscribers.discard(exclude_user)
        
        disconnected_users = []
        
        for user_email in subscribers:
            if user_email in self.user_connections:
                try:
                    await self.user_connections[user_email].send_json(message)
                except Exception as e:
                    logger.error(f"❌ Failed to send to {user_email}: {e}")
                    disconnected_users.append(user_email)
        
        # Clean up disconnected users
        for user_email in disconnected_users:
            self.disconnect(user_email)
        
        logger.debug(f"📤 Broadcasted to {len(subscribers)} users in conversation {conversation_id}")
    
    def _broadcast_to_conversation_sync(self, conversation_id: str, message: dict):
        """Synchronous version for cleanup operations"""
        # This is called during disconnect, so we can't await
        # Just log the event
        logger.debug(f"User left conversation {conversation_id}")
    
    async def send_to_user(self, user_email: str, message: dict):
        """Send a message to a specific user"""
        if user_email in self.user_connections:
            try:
                await self.user_connections[user_email].send_json(message)
                logger.debug(f"📨 Sent message to {user_email}")
            except Exception as e:
                logger.error(f"❌ Failed to send to {user_email}: {e}")
                self.disconnect(user_email)
        else:
            logger.warning(f"⚠️ User {user_email} not connected")
    
    async def broadcast_new_message(self, conversation_id: str, message_data: dict):
        """Broadcast a new message to all subscribers in a conversation"""
        await self.broadcast_to_conversation(
            conversation_id,
            {
                "type": "new_message",
                "conversation_id": conversation_id,
                "message": message_data,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
    
    async def broadcast_message_updated(self, conversation_id: str, message_data: dict):
        """Broadcast a message update (edit) to all subscribers"""
        await self.broadcast_to_conversation(
            conversation_id,
            {
                "type": "message_updated",
                "conversation_id": conversation_id,
                "message": message_data,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
    
    async def broadcast_message_deleted(self, conversation_id: str, message_id: str):
        """Broadcast a message deletion to all subscribers"""
        await self.broadcast_to_conversation(
            conversation_id,
            {
                "type": "message_deleted",
                "conversation_id": conversation_id,
                "message_id": message_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
    
    async def broadcast_typing_indicator(
        self, 
        conversation_id: str, 
        user_email: str, 
        is_typing: bool
    ):
        """Broadcast typing indicator to conversation subscribers"""
        # Update typing status
        if conversation_id not in self.typing_status:
            self.typing_status[conversation_id] = {}
        
        if is_typing:
            self.typing_status[conversation_id][user_email] = datetime.now(timezone.utc)
        else:
            self.typing_status[conversation_id].pop(user_email, None)
        
        # Broadcast to others (exclude the typing user)
        await self.broadcast_to_conversation(
            conversation_id,
            {
                "type": "typing_indicator",
                "conversation_id": conversation_id,
                "user_email": user_email,
                "is_typing": is_typing,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            exclude_user=user_email
        )
    
    async def broadcast_conversation_updated(self, conversation_id: str, conversation_data: dict):
        """Broadcast conversation update (name change, participant added, etc.)"""
        await self.broadcast_to_conversation(
            conversation_id,
            {
                "type": "conversation_updated",
                "conversation_id": conversation_id,
                "conversation": conversation_data,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
    
    def get_online_users(self, conversation_id: str) -> List[str]:
        """Get list of online users in a conversation"""
        if conversation_id not in self.conversation_subscribers:
            return []
        return list(self.conversation_subscribers[conversation_id])
    
    def get_stats(self) -> dict:
        """Get connection statistics"""
        return {
            "total_connections": len(self.user_connections),
            "total_conversations": len(self.conversation_subscribers),
            "total_subscriptions": sum(len(subs) for subs in self.user_subscriptions.values())
        }


# Global instance
connection_manager = ConnectionManager()
