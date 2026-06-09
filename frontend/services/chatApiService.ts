/**
 * Chat API Service
 * HTTP client for chat backend API endpoints
 */

import type {
  Conversation,
  Message,
  CreateDirectConversationParams,
  CreateGroupConversationParams,
  SendMessageParams,
  UpdateConversationParams,
  AddParticipantsParams,
} from '../types/chat';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ============================================================================
// CONVERSATION ENDPOINTS
// ============================================================================

/**
 * Create a new conversation (direct or group)
 */
export const createConversation = async (
  type: 'direct' | 'group',
  participants: string[],
  participantNames: string[],
  createdBy: string,
  name?: string,
  description?: string,
  participantAvatars?: string[]
): Promise<Conversation> => {
  const response = await fetch(`${BACKEND_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      name,
      description,
      avatarUrl: null,
      participants,
      participantNames,
      participantAvatars,
      createdBy,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }

  return response.json();
};

/**
 * Create a direct (1-on-1) conversation
 */
export const createDirectConversation = async (
  currentUserEmail: string,
  currentUserName: string,
  otherUserEmail: string,
  otherUserName: string,
  otherUserAvatar?: string
): Promise<Conversation> => {
  return createConversation(
    'direct',
    [currentUserEmail, otherUserEmail],
    [currentUserName, otherUserName],
    currentUserEmail,
    undefined,
    undefined,
    otherUserAvatar ? [undefined, otherUserAvatar] : undefined
  );
};

/**
 * Create a group conversation
 */
export const createGroupConversation = async (
  name: string,
  participants: string[],
  participantNames: string[],
  createdBy: string,
  description?: string,
  participantAvatars?: string[]
): Promise<Conversation> => {
  return createConversation(
    'group',
    participants,
    participantNames,
    createdBy,
    name,
    description,
    participantAvatars
  );
};

/**
 * List all conversations for a user
 */
export const listConversations = async (userEmail: string): Promise<{ documents: Conversation[]; total: number }> => {
  const response = await fetch(`${BACKEND_URL}/api/conversations?user_email=${encodeURIComponent(userEmail)}`);

  if (!response.ok) {
    throw new Error('Failed to list conversations');
  }

  return response.json();
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<Conversation> => {
  const response = await fetch(`${BACKEND_URL}/api/conversations/${conversationId}`);

  if (!response.ok) {
    throw new Error('Failed to get conversation');
  }

  return response.json();
};

/**
 * Update conversation details (name, description, avatar)
 */
export const updateConversation = async (
  conversationId: string,
  userEmail: string,
  updates: { name?: string; description?: string; avatarUrl?: string }
): Promise<Conversation> => {
  const response = await fetch(
    `${BACKEND_URL}/api/conversations/${conversationId}?user_email=${encodeURIComponent(userEmail)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update conversation');
  }

  return response.json();
};

/**
 * Delete a conversation (only creator can delete)
 */
export const deleteConversation = async (conversationId: string, userEmail: string): Promise<{ message: string }> => {
  const response = await fetch(
    `${BACKEND_URL}/api/conversations/${conversationId}?user_email=${encodeURIComponent(userEmail)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete conversation');
  }

  return response.json();
};

// ============================================================================
// PARTICIPANT MANAGEMENT
// ============================================================================

/**
 * Add participants to a group conversation
 */
export const addParticipants = async (
  conversationId: string,
  emails: string[],
  names: string[],
  userEmail: string,
  avatars?: string[]
): Promise<{ message: string }> => {
  const response = await fetch(
    `${BACKEND_URL}/api/conversations/${conversationId}/participants?user_email=${encodeURIComponent(userEmail)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emails,
        names,
        avatars,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add participants');
  }

  return response.json();
};

/**
 * Remove a participant from a group conversation
 */
export const removeParticipant = async (
  conversationId: string,
  participantEmail: string,
  userEmail: string
): Promise<{ message: string }> => {
  const response = await fetch(
    `${BACKEND_URL}/api/conversations/${conversationId}/participants?participant_email=${encodeURIComponent(
      participantEmail
    )}&user_email=${encodeURIComponent(userEmail)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to remove participant');
  }

  return response.json();
};

// ============================================================================
// MESSAGE ENDPOINTS
// ============================================================================

/**
 * Send a new message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string,
  type: string = 'text',
  senderAvatar?: string,
  attachmentUrl?: string,
  attachmentName?: string,
  attachmentSize?: number,
  replyTo?: string
): Promise<Message> => {
  const response = await fetch(`${BACKEND_URL}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      content,
      type,
      attachmentUrl,
      attachmentName,
      attachmentSize,
      replyTo,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

/**
 * List messages in a conversation (paginated)
 */
export const listMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ documents: Message[]; total: number }> => {
  const response = await fetch(
    `${BACKEND_URL}/api/messages?conversation_id=${encodeURIComponent(conversationId)}&limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error('Failed to list messages');
  }

  return response.json();
};

/**
 * Get a single message by ID
 */
export const getMessage = async (messageId: string): Promise<Message> => {
  const response = await fetch(`${BACKEND_URL}/api/messages/${messageId}`);

  if (!response.ok) {
    throw new Error('Failed to get message');
  }

  return response.json();
};

/**
 * Update a message (edit content)
 */
export const updateMessage = async (
  messageId: string,
  userEmail: string,
  content: string
): Promise<Message> => {
  const response = await fetch(
    `${BACKEND_URL}/api/messages/${messageId}?user_email=${encodeURIComponent(userEmail)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        isEdited: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update message');
  }

  return response.json();
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string, userEmail: string): Promise<{ message: string }> => {
  const response = await fetch(
    `${BACKEND_URL}/api/messages/${messageId}?user_email=${encodeURIComponent(userEmail)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete message');
  }

  return response.json();
};

/**
 * Mark multiple messages as read
 */
export const markMessagesAsRead = async (messageIds: string[], userEmail: string): Promise<{ message: string }> => {
  const response = await fetch(`${BACKEND_URL}/api/messages/mark-read`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messageIds,
      userEmail,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to mark messages as read');
  }

  return response.json();
};

/**
 * Search messages in a conversation
 */
export const searchMessages = async (
  conversationId: string,
  query: string,
  limit: number = 20
): Promise<{ documents: Message[]; total: number }> => {
  const response = await fetch(
    `${BACKEND_URL}/api/conversations/${conversationId}/search?query=${encodeURIComponent(query)}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to search messages');
  }

  return response.json();
};
