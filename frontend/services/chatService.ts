/**
 * Chat Service
 * Handles all chat-related operations using Python backend API
 */

import * as chatApiService from './chatApiService';
import {
  Conversation,
  Message,
  UserPresence,
  ConversationType,
  MessageType,
  UserStatus,
  CreateDirectConversationParams,
  CreateGroupConversationParams,
  SendMessageParams,
  UpdateConversationParams,
  AddParticipantsParams,
  UnsubscribeFunction,
  UnreadCountsMap,
  ChatError,
  ChatErrorCode,
} from '../types/chat';

// ============================================================================
// Conversation Operations
// ============================================================================

/**
 * List all conversations for a user
 */
export const listConversations = async (userEmail: string): Promise<Conversation[]> => {
  try {
    const response = await chatApiService.listConversations(userEmail);
    return response.documents;
  } catch (error: any) {
    console.error('Error listing conversations:', error);
    throw new ChatError('Failed to load conversations', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<Conversation> => {
  try {
    return await chatApiService.getConversation(conversationId);
  } catch (error: any) {
    console.error('Error getting conversation:', error);
    throw new ChatError('Conversation not found', ChatErrorCode.NOT_FOUND, error);
  }
};

/**
 * Create a direct conversation (1-on-1)
 */
export const createDirectConversation = async (
  currentUserEmail: string,
  currentUserName: string,
  params: CreateDirectConversationParams
): Promise<Conversation> => {
  try {
    return await chatApiService.createDirectConversation(
      currentUserEmail,
      currentUserName,
      params.otherUserEmail,
      params.otherUserName,
      params.otherUserAvatar
    );
  } catch (error: any) {
    console.error('Error creating direct conversation:', error);
    throw new ChatError('Failed to create conversation', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Create a group conversation
 */
export const createGroupConversation = async (
  currentUserEmail: string,
  currentUserName: string,
  params: CreateGroupConversationParams
): Promise<Conversation> => {
  try {
    return await chatApiService.createGroupConversation(
      params.name,
      [currentUserEmail, ...params.participantEmails],
      [currentUserName, ...params.participantNames],
      currentUserEmail,
      params.description,
      params.participantAvatars
    );
  } catch (error: any) {
    console.error('Error creating group conversation:', error);
    throw new ChatError('Failed to create group', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Update conversation details (name, description, avatar)
 */
export const updateConversation = async (
  conversationId: string,
  userEmail: string,
  params: UpdateConversationParams
): Promise<Conversation> => {
  try {
    return await chatApiService.updateConversation(conversationId, userEmail, params);
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    throw new ChatError('Failed to update conversation', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Add participants to a group conversation
 */
export const addParticipants = async (
  conversationId: string,
  params: AddParticipantsParams,
  userEmail: string
): Promise<void> => {
  try {
    await chatApiService.addParticipants(
      conversationId,
      params.participantEmails,
      params.participantNames,
      userEmail,
      params.participantAvatars
    );
  } catch (error: any) {
    console.error('Error adding participants:', error);
    throw new ChatError('Failed to add participants', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Remove a participant from a group conversation
 */
export const removeParticipant = async (
  conversationId: string,
  participantEmail: string,
  userEmail: string
): Promise<void> => {
  try {
    await chatApiService.removeParticipant(conversationId, participantEmail, userEmail);
  } catch (error: any) {
    console.error('Error removing participant:', error);
    throw new ChatError('Failed to remove participant', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Leave a group conversation
 */
export const leaveConversation = async (
  conversationId: string,
  userEmail: string
): Promise<void> => {
  try {
    await removeParticipant(conversationId, userEmail, userEmail);
  } catch (error: any) {
    console.error('Error leaving conversation:', error);
    throw new ChatError('Failed to leave conversation', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (
  conversationId: string,
  userEmail: string
): Promise<void> => {
  try {
    await chatApiService.deleteConversation(conversationId, userEmail);
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    throw new ChatError('Failed to delete conversation', ChatErrorCode.NETWORK_ERROR, error);
  }
};

// ============================================================================
// Message Operations
// ============================================================================

/**
 * List messages in a conversation
 */
export const listMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  try {
    const response = await chatApiService.listMessages(conversationId, limit, offset);
    // Reverse to show oldest first (backend returns newest first)
    return response.documents.reverse();
  } catch (error: any) {
    console.error('Error listing messages:', error);
    throw new ChatError('Failed to load messages', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Upload a file for chat
 * Note: This is a placeholder - file upload should go through the storage service
 */
export const uploadChatFile = async (file: File): Promise<{ fileId: string; fileUrl: string }> => {
  try {
    // TODO: Implement file upload using the storage API service
    // For now, return a placeholder
    throw new Error('File upload not yet implemented - use storage service');
  } catch (error: any) {
    console.error('Error uploading file:', error);
    throw new ChatError('Failed to upload file', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Send a message
 */
export const sendMessage = async (
  params: SendMessageParams,
  senderEmail: string,
  senderName: string,
  senderAvatar?: string
): Promise<Message> => {
  try {
    return await chatApiService.sendMessage(
      params.conversationId,
      senderEmail,
      senderName,
      params.content,
      params.type || 'text',
      senderAvatar,
      params.attachmentUrl,
      params.attachmentName,
      params.attachmentSize,
      params.replyTo
    );
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw new ChatError('Failed to send message', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Edit a message
 */
export const editMessage = async (messageId: string, newContent: string, userEmail: string): Promise<Message> => {
  try {
    return await chatApiService.updateMessage(messageId, userEmail, newContent);
  } catch (error: any) {
    console.error('Error editing message:', error);
    throw new ChatError('Failed to edit message', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string, userEmail: string): Promise<void> => {
  try {
    await chatApiService.deleteMessage(messageId, userEmail);
  } catch (error: any) {
    console.error('Error deleting message:', error);
    throw new ChatError('Failed to delete message', ChatErrorCode.NETWORK_ERROR, error);
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  conversationId: string,
  userEmail: string
): Promise<void> => {
  try {
    // Get all messages in the conversation
    const messages = await listMessages(conversationId, 100, 0);
    
    // Filter unread messages (those not read by current user)
    const unreadMessageIds = messages
      .filter(msg => msg.senderId !== userEmail && !msg.readBy.includes(userEmail))
      .map(msg => msg.$id);
    
    if (unreadMessageIds.length > 0) {
      await chatApiService.markMessagesAsRead(unreadMessageIds, userEmail);
    }
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    // Don't throw - this is a non-critical operation
  }
};

// ============================================================================
// Presence Operations (Placeholder - To be implemented)
// ============================================================================

/**
 * Update user presence (online/away/offline)
 * TODO: Implement presence tracking in Python backend
 */
export const updatePresence = async (
  userEmail: string,
  userName: string,
  status: UserStatus
): Promise<void> => {
  try {
    // Presence tracking to be implemented in Python backend
    console.log(`Presence update: ${userEmail} is ${status}`);
  } catch (error: any) {
    console.error('Error updating presence:', error);
    // Don't throw - presence is optional
  }
};

/**
 * Set typing indicator
 * TODO: Implement typing indicators in Python backend
 */
export const setTyping = async (
  userEmail: string,
  conversationId: string | null
): Promise<void> => {
  try {
    // Typing indicators to be implemented in Python backend
    console.log(`${userEmail} is typing in ${conversationId}`);
  } catch (error: any) {
    console.error('Error setting typing indicator:', error);
    // Don't throw - typing is optional
  }
};

/**
 * Get presence for multiple users
 * TODO: Implement presence tracking in Python backend
 */
export const getUsersPresence = async (userEmails: string[]): Promise<UserPresence[]> => {
  try {
    // Presence tracking to be implemented
    return [];
  } catch (error: any) {
    console.error('Error getting users presence:', error);
    return [];
  }
};

// ============================================================================
// Real-time Subscriptions (WebSocket with Polling Fallback)
// ============================================================================

import { getWebSocketService } from './webSocketService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

/**
 * Subscribe to conversation changes via WebSocket
 * Falls back to polling if WebSocket fails
 */
export const subscribeToConversations = (
  userEmail: string,
  callback: (conversation: Conversation) => void
): UnsubscribeFunction => {
  console.log('📡 subscribeToConversations - Using WebSocket');
  
  const ws = getWebSocketService(BACKEND_URL);
  
  // Connect to WebSocket
  ws.connect(userEmail, (data) => {
    if (data.type === 'conversation_updated' && data.conversation) {
      callback(data.conversation);
    }
  }).catch(error => {
    console.error('Failed to connect to WebSocket:', error);
    // WebSocket connection failed, ChatContext will fall back to polling
  });
  
  // Return unsubscribe function
  return () => {
    console.log('🔌 Unsubscribed from conversations (WebSocket)');
    // Don't disconnect the WebSocket entirely, as it may be used by messages
  };
};

/**
 * Subscribe to messages in a conversation via WebSocket
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (message: Message, event: string) => void
): UnsubscribeFunction => {
  console.log(`📡 subscribeToMessages for ${conversationId} - Using WebSocket`);
  
  const ws = getWebSocketService(BACKEND_URL);
  
  // Subscribe to this specific conversation
  ws.subscribeToConversation(conversationId);
  
  // Handle incoming messages
  const messageHandler = (data: any) => {
    if (data.conversation_id === conversationId) {
      if (data.type === 'new_message' && data.message) {
        callback(data.message, 'create');
      } else if (data.type === 'message_updated' && data.message) {
        callback(data.message, 'update');
      } else if (data.type === 'message_deleted' && data.message_id) {
        callback({ $id: data.message_id } as Message, 'delete');
      }
    }
  };
  
  ws.connect(ws['userEmail'] || '', messageHandler).catch(error => {
    console.error('Failed to connect to WebSocket for messages:', error);
  });
  
  // Return unsubscribe function
  return () => {
    console.log(`🔌 Unsubscribed from messages for ${conversationId}`);
    ws.unsubscribeFromConversation(conversationId);
  };
};

/**
 * Subscribe to presence changes (placeholder)
 * TODO: Implement presence tracking in Python backend
 */
export const subscribeToPresence = (
  callback: (presence: UserPresence) => void
): UnsubscribeFunction => {
  // Presence subscriptions to be implemented
  return () => {
    console.log('Unsubscribed from presence');
  };
};

/**
 * Send typing indicator
 */
export const sendTypingIndicator = (conversationId: string, isTyping: boolean): void => {
  const ws = getWebSocketService(BACKEND_URL);
  if (ws.isConnected()) {
    ws.sendTypingIndicator(conversationId, isTyping);
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get unread count for a conversation
 */
export const getUnreadCount = (conversation: Conversation, userEmail: string): number => {
  try {
    const unreadCounts: UnreadCountsMap = JSON.parse(conversation.unreadCounts || '{}');
    return unreadCounts[userEmail] || 0;
  } catch {
    return 0;
  }
};

/**
 * Increment unread count for a conversation
 * Note: This is handled by the backend automatically
 */
export const incrementUnreadCount = async (
  conversationId: string,
  userEmail: string
): Promise<void> => {
  // Backend handles unread counts automatically
  console.log(`Unread count incremented for ${conversationId}`);
};

export default {
  // Conversations
  listConversations,
  getConversation,
  createDirectConversation,
  createGroupConversation,
  updateConversation,
  addParticipants,
  removeParticipant,
  leaveConversation,
  deleteConversation,

  // Messages
  listMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessagesAsRead,

  // Files
  uploadChatFile,

  // Presence
  updatePresence,
  setTyping,
  getUsersPresence,

  // Real-time
  subscribeToConversations,
  subscribeToMessages,
  subscribeToPresence,
  sendTypingIndicator,

  // Helpers
  getUnreadCount,
  incrementUnreadCount,
};
