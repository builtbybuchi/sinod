import { 
  createDirectConversation, 
  sendMessage as sendChatMessage,
  listMessages,
  subscribeToMessages,
  editMessage,
} from './chatService';
import type { Message } from '../types/chat';

// Python backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// La Presi AI user details - special participant in chat system
export const LA_PRESI_USER = {
  email: 'ai@lapresi.sinod',
  name: 'La Presi',
  avatar: 'LP',
};

// ============================================================================
// Types
// ============================================================================

export interface SendAIMessageParams {
  conversationId: string;
  message: string;
  userEmail: string;
  userName: string;
  senderAvatar?: string;
  includeEvents?: boolean;
  includeDocuments?: boolean;
  includeTasks?: boolean;
  eventIds?: string[];
  documentIds?: string[];
}

// ============================================================================
// Conversation Operations
// ============================================================================

/**
 * Create or get AI conversation with La Presi
 * Uses the existing chat conversation system
 */
export const getOrCreateAIConversation = async (
  userEmail: string,
  userName: string
): Promise<string> => {
  try {
    // Create direct conversation with La Presi (will return existing if already exists)
    const conversation = await createDirectConversation(
      userEmail,
      userName,
      {
        otherUserEmail: LA_PRESI_USER.email,
        otherUserName: LA_PRESI_USER.name,
        otherUserAvatar: LA_PRESI_USER.avatar,
      }
    );

    return conversation.$id;
  } catch (error) {
    console.error('Error creating AI conversation:', error);
    throw error;
  }
};

/**
 * Check if a conversation is with La Presi AI
 */
export const isAIConversation = (participants: string[]): boolean => {
  return participants.includes(LA_PRESI_USER.email);
};

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Send message to AI and get streaming response
 * Uses existing chat message collection
 */
export const sendAIMessage = async (
  params: SendAIMessageParams,
  onChunk?: (chunk: string) => void
): Promise<Message> => {
  try {
    // 1. Send user message using existing chat service
    const userMessage = await sendChatMessage(
      {
        conversationId: params.conversationId,
        content: params.message,
      },
      params.userEmail,
      params.userName,
      params.senderAvatar
    );

    // 2. Create placeholder for AI response in chat
    const aiMessagePlaceholder = await sendChatMessage(
      {
        conversationId: params.conversationId,
        content: '...',
      },
      LA_PRESI_USER.email,
      LA_PRESI_USER.name,
      LA_PRESI_USER.avatar
    );

    // 3. Stream response from Python backend
    const response = await fetch(`${BACKEND_URL}/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: params.userEmail,
        user_name: params.userName,
        message: params.message,
        conversation_id: params.conversationId,
        include_events: params.includeEvents ?? true,
        include_documents: params.includeDocuments ?? false,
        include_tasks: params.includeTasks ?? false,
        event_ids: params.eventIds,
        document_ids: params.documentIds,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    // 4. Handle streaming response and update message
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonString = line.slice(6);
              if (!jsonString.trim()) continue; // Skip empty data lines
              
              const data = JSON.parse(jsonString);
              
              if (data.chunk) {
                fullContent += data.chunk;
                
                // Update message via chat service (uses Python backend)
                await editMessage(
                  aiMessagePlaceholder.$id,
                  fullContent,
                  LA_PRESI_USER.email
                );

                // Call callback
                onChunk?.(data.chunk);
              }

              if (data.done) {
                // Stream completed successfully
                break;
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
              console.error('Line that caused error:', line);
            }
          }
        }
      }
    }

    // Return the final AI message
    return {
      ...aiMessagePlaceholder,
      content: fullContent,
    };
  } catch (error) {
    console.error('Error sending AI message:', error);
    throw error;
  }
};

/**
 * Get conversation history for context
 */
export const getConversationHistory = async (
  conversationId: string,
  limit: number = 10
): Promise<Array<{role: string, content: string}>> => {
  try {
    const messages = await listMessages(conversationId, limit);
    
    return messages.map(msg => ({
      role: msg.senderId === LA_PRESI_USER.email ? 'assistant' : 'user',
      content: msg.content,
    }));
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
};

export default {
  getOrCreateAIConversation,
  isAIConversation,
  sendAIMessage,
  getConversationHistory,
  LA_PRESI_USER,
};
