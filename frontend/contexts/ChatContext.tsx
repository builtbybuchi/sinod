/**
 * Chat Context
 * Global state management for the chat system
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import chatService from '../services/chatService';
import {
  Conversation,
  ConversationListItem,
  Message,
  MessageWithSender,
  UserPresence,
  ParticipantInfo,
  ChatState,
  ChatActions,
  CreateDirectConversationParams,
  CreateGroupConversationParams,
  SendMessageParams,
  UpdateConversationParams,
  AddParticipantsParams,
  UserStatus,
  ConversationType,
  UnsubscribeFunction,
} from '../types/chat';

// ============================================================================
// Context Definition
// ============================================================================

interface ChatContextValue extends ChatState, ChatActions {}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

// ============================================================================
// Provider Component
// ============================================================================

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // State
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Polling fallback state
  const [usePolling, setUsePolling] = useState(false);
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Subscriptions
  const [conversationsUnsubscribe, setConversationsUnsubscribe] = useState<UnsubscribeFunction | null>(null);
  const [messagesUnsubscribe, setMessagesUnsubscribe] = useState<UnsubscribeFunction | null>(null);
  const [presenceUnsubscribe, setPresenceUnsubscribe] = useState<UnsubscribeFunction | null>(null);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Convert Conversation to ConversationListItem with display properties
   */
  const enrichConversation = useCallback((conv: Conversation): ConversationListItem => {
    const currentUserEmail = currentUser?.email || '';
    
    // Get display name and avatar
    let displayName = conv.name || '';
    let displayAvatar = conv.avatarUrl;
    let otherParticipants: ParticipantInfo[] = [];

    if (conv.type === ConversationType.DIRECT) {
      // For direct chats, show the other person's info
      const otherIndex = conv.participants.findIndex(p => p !== currentUserEmail);
      if (otherIndex !== -1) {
        displayName = conv.participantNames[otherIndex] || conv.participants[otherIndex];
        displayAvatar = conv.participantAvatars?.[otherIndex];
        
        otherParticipants = [{
          email: conv.participants[otherIndex],
          name: conv.participantNames[otherIndex],
          avatar: conv.participantAvatars?.[otherIndex],
          isOnline: onlineUsers[conv.participants[otherIndex]]?.status === UserStatus.ONLINE,
          status: onlineUsers[conv.participants[otherIndex]]?.status,
        }];
      }
    } else {
      // For group chats, collect all other participants
      otherParticipants = conv.participants
        .filter(p => p !== currentUserEmail)
        .map((email, idx) => {
          const actualIndex = conv.participants.indexOf(email);
          return {
            email,
            name: conv.participantNames[actualIndex] || email,
            avatar: conv.participantAvatars?.[actualIndex],
            isOnline: onlineUsers[email]?.status === UserStatus.ONLINE,
            status: onlineUsers[email]?.status,
          };
        });
    }

    // Get unread count
    const unreadCount = chatService.getUnreadCount(conv, currentUserEmail);

    // Check if anyone is online
    const isOnline = otherParticipants.some(p => p.isOnline);

    // Format last message preview
    let lastMessagePreview = conv.lastMessage || '';
    if (conv.lastMessageBy && conv.lastMessageBy !== currentUserEmail) {
      const senderIndex = conv.participants.indexOf(conv.lastMessageBy);
      const senderName = conv.participantNames[senderIndex] || 'Someone';
      lastMessagePreview = `${senderName}: ${lastMessagePreview}`;
    }

    return {
      ...conv,
      displayName,
      displayAvatar,
      unreadCount,
      isOnline,
      lastMessagePreview,
      otherParticipants,
    };
  }, [currentUser, onlineUsers]);

  /**
   * Convert Message to MessageWithSender
   */
  const enrichMessage = useCallback((msg: Message, conv: Conversation | null): MessageWithSender => {
    const currentUserEmail = currentUser?.email || '';
    const isOwn = msg.senderId === currentUserEmail;

    // Get sender info
    const senderIndex = conv?.participants.indexOf(msg.senderId) ?? -1;
    const sender: ParticipantInfo = {
      email: msg.senderId,
      name: msg.senderName || (senderIndex >= 0 ? conv?.participantNames[senderIndex] : msg.senderId) || 'Unknown',
      avatar: msg.senderAvatar || (senderIndex >= 0 ? conv?.participantAvatars?.[senderIndex] : undefined),
      isOnline: onlineUsers[msg.senderId]?.status === UserStatus.ONLINE,
      status: onlineUsers[msg.senderId]?.status,
    };

    return {
      ...msg,
      isOwn,
      sender,
    };
  }, [currentUser, onlineUsers]);

  // ============================================================================
  // Conversation Actions
  // ============================================================================

  const loadConversations = useCallback(async () => {
    if (!currentUser?.email) return;

    try {
      setLoading(true);
      setError(null);
      const convs = await chatService.listConversations(currentUser.email);
      const enriched = convs.map(enrichConversation);
      setConversations(enriched);

      // Update unread counts
      const counts: Record<string, number> = {};
      enriched.forEach(conv => {
        counts[conv.$id] = conv.unreadCount;
      });
      setUnreadCounts(counts);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUser, enrichConversation]);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
    
    // Mark as read when opening
    if (conversationId && currentUser?.email) {
      chatService.markMessagesAsRead(conversationId, currentUser.email).catch(console.error);
    }
  }, [currentUser]);

  const createDirectConversation = useCallback(async (params: CreateDirectConversationParams): Promise<Conversation> => {
    if (!currentUser?.email || !currentUser?.name) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      const conv = await chatService.createDirectConversation(
        currentUser.email,
        currentUser.name,
        params
      );
      
      await loadConversations();
      return conv;
    } catch (err: any) {
      console.error('Error creating direct conversation:', err);
      setError(err.message || 'Failed to create conversation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadConversations]);

  const createGroupConversation = useCallback(async (params: CreateGroupConversationParams): Promise<Conversation> => {
    if (!currentUser?.email || !currentUser?.name) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      const conv = await chatService.createGroupConversation(
        currentUser.email,
        currentUser.name,
        params
      );
      
      await loadConversations();
      return conv;
    } catch (err: any) {
      console.error('Error creating group conversation:', err);
      setError(err.message || 'Failed to create group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadConversations]);

  const updateConversation = useCallback(async (conversationId: string, params: UpdateConversationParams) => {
    if (!currentUser?.email) return;
    try {
      await chatService.updateConversation(conversationId, currentUser.email, params);
      await loadConversations();
    } catch (err: any) {
      console.error('Error updating conversation:', err);
      setError(err.message || 'Failed to update conversation');
      throw err;
    }
  }, [currentUser, loadConversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!currentUser?.email) return;
    try {
      await chatService.deleteConversation(conversationId, currentUser.email);
      
      // Remove from state
      setConversations(prev => prev.filter(c => c.$id !== conversationId));
      delete messages[conversationId];
      
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      setError(err.message || 'Failed to delete conversation');
      throw err;
    }
  }, [currentUser, activeConversationId, messages]);

  const leaveConversation = useCallback(async (conversationId: string) => {
    if (!currentUser?.email) return;

    try {
      await chatService.leaveConversation(conversationId, currentUser.email);
      await loadConversations();
      
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }
    } catch (err: any) {
      console.error('Error leaving conversation:', err);
      setError(err.message || 'Failed to leave conversation');
      throw err;
    }
  }, [currentUser, activeConversationId, loadConversations]);

  const addParticipants = useCallback(async (conversationId: string, params: AddParticipantsParams) => {
    if (!currentUser?.name) return;

    try {
      await chatService.addParticipants(conversationId, params, currentUser.name);
      await loadConversations();
    } catch (err: any) {
      console.error('Error adding participants:', err);
      setError(err.message || 'Failed to add participants');
      throw err;
    }
  }, [currentUser, loadConversations]);

  const removeParticipant = useCallback(async (conversationId: string, participantEmail: string) => {
    if (!currentUser?.name) return;

    try {
      await chatService.removeParticipant(conversationId, participantEmail, currentUser.name);
      await loadConversations();
    } catch (err: any) {
      console.error('Error removing participant:', err);
      setError(err.message || 'Failed to remove participant');
      throw err;
    }
  }, [currentUser, loadConversations]);

  // ============================================================================
  // Message Actions
  // ============================================================================

  const loadMessages = useCallback(async (conversationId: string, limit: number = 50, offset: number = 0) => {
    try {
      const msgs = await chatService.listMessages(conversationId, limit, offset);
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: offset === 0 ? msgs : [...msgs, ...(prev[conversationId] || [])],
      }));
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  }, []);

  const sendMessage = useCallback(async (params: SendMessageParams): Promise<Message> => {
    if (!currentUser?.email || !currentUser?.name) {
      throw new Error('User not authenticated');
    }

    try {
      const msg = await chatService.sendMessage(
        params,
        currentUser.email,
        currentUser.name,
        currentUser.prefs?.avatar
      );

      // Optimistically add to state with duplicate check
      setMessages(prev => {
        const existingMessages = prev[params.conversationId] || [];
        const messageExists = existingMessages.some(m => m.$id === msg.$id);
        
        if (messageExists) {
          return prev; // Don't add if already exists
        }
        
        return {
          ...prev,
          [params.conversationId]: [...existingMessages, msg],
        };
      });

      // Reload conversations to update last message preview
      loadConversations();

      return msg;
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      throw err;
    }
  }, [currentUser, loadConversations]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!currentUser?.email) return;
    try {
      await chatService.editMessage(messageId, newContent, currentUser.email);
      
      // Update in state
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].map(msg =>
            msg.$id === messageId ? { ...msg, content: newContent, isEdited: true } : msg
          );
        });
        return updated;
      });
    } catch (err: any) {
      console.error('Error editing message:', err);
      setError(err.message || 'Failed to edit message');
      throw err;
    }
  }, [currentUser]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!currentUser?.email) return;
    try {
      await chatService.deleteMessage(messageId, currentUser.email);
      
      // Remove from state
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].filter(msg => msg.$id !== messageId);
        });
        return updated;
      });
    } catch (err: any) {
      console.error('Error deleting message:', err);
      setError(err.message || 'Failed to delete message');
      throw err;
    }
  }, [currentUser]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser?.email) return;

    try {
      await chatService.markMessagesAsRead(conversationId, currentUser.email);
      
      // Update unread count
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0,
      }));
    } catch (err: any) {
      console.error('Error marking as read:', err);
    }
  }, [currentUser]);

  // ============================================================================
  // Presence & Typing Actions
  // ============================================================================

  const updatePresence = useCallback(async (status: UserStatus) => {
    if (!currentUser?.email || !currentUser?.name) return;

    try {
      await chatService.updatePresence(currentUser.email, currentUser.name, status);
    } catch (err: any) {
      console.error('Error updating presence:', err);
    }
  }, [currentUser]);

  const setTyping = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!currentUser?.email) return;

    try {
      await chatService.setTyping(currentUser.email, isTyping ? conversationId : null);
    } catch (err: any) {
      console.error('Error setting typing:', err);
    }
  }, [currentUser]);

  // ============================================================================
  // Real-time Subscriptions
  // ============================================================================

  const subscribeToConversations = useCallback(() => {
    if (!currentUser?.email || conversationsUnsubscribe) return;

    const unsubscribe = chatService.subscribeToConversations(
      currentUser.email,
      (conversation: Conversation) => {
        const enriched = enrichConversation(conversation);
        
        setConversations(prev => {
          const existing = prev.find(c => c.$id === conversation.$id);
          if (existing) {
            return prev.map(c => c.$id === conversation.$id ? enriched : c);
          }
          return [enriched, ...prev];
        });
      }
    );

    setConversationsUnsubscribe(() => unsubscribe);
  }, [currentUser, conversationsUnsubscribe, enrichConversation]);

  const subscribeToMessages = useCallback((conversationId: string) => {
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
    }

    const unsubscribe = chatService.subscribeToMessages(
      conversationId,
      (message: Message, event: string) => {
        if (event.includes('.create')) {
          setMessages(prev => {
            const existingMessages = prev[conversationId] || [];
            // Check if message already exists (from optimistic update)
            const messageExists = existingMessages.some(msg => msg.$id === message.$id);
            
            if (messageExists) {
              return prev; // Don't add duplicate
            }
            
            return {
              ...prev,
              [conversationId]: [...existingMessages, message],
            };
          });

          // Increment unread if not sent by current user
          if (message.senderId !== currentUser?.email) {
            setUnreadCounts(prev => ({
              ...prev,
              [conversationId]: (prev[conversationId] || 0) + 1,
            }));
          }
        } else if (event.includes('.update')) {
          setMessages(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).map(msg =>
              msg.$id === message.$id ? message : msg
            ),
          }));
        } else if (event.includes('.delete')) {
          setMessages(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter(msg => msg.$id !== message.$id),
          }));
        }
      }
    );

    setMessagesUnsubscribe(() => unsubscribe);
  }, [currentUser, messagesUnsubscribe]);

  const subscribeToPresence = useCallback(() => {
    if (presenceUnsubscribe) return;

    const unsubscribe = chatService.subscribeToPresence((presence: UserPresence) => {
      setOnlineUsers(prev => ({
        ...prev,
        [presence.userEmail]: presence,
      }));

      // Update typing indicators
      if (presence.typingIn) {
        setTypingUsers(prev => {
          const existing = prev[presence.typingIn!] || [];
          if (!existing.includes(presence.userEmail)) {
            return {
              ...prev,
              [presence.typingIn!]: [...existing, presence.userEmail],
            };
          }
          return prev;
        });
      } else {
        // Remove from all typing
        setTypingUsers(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(convId => {
            updated[convId] = updated[convId].filter(email => email !== presence.userEmail);
          });
          return updated;
        });
      }
    });

    setPresenceUnsubscribe(() => unsubscribe);
  }, [presenceUnsubscribe]);

  const unsubscribeAll = useCallback(() => {
    if (conversationsUnsubscribe) {
      conversationsUnsubscribe();
      setConversationsUnsubscribe(null);
    }
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
      setMessagesUnsubscribe(null);
    }
    if (presenceUnsubscribe) {
      presenceUnsubscribe();
      setPresenceUnsubscribe(null);
    }
  }, [conversationsUnsubscribe, messagesUnsubscribe, presenceUnsubscribe]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Polling function for when WebSocket fails
  const pollForUpdates = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      // Reload conversations
      const convs = await chatService.listConversations(currentUser.email);
      setConversations(convs.map(enrichConversation));
      
      // Reload active conversation messages if there's an active conversation
      if (activeConversationId) {
        const msgs = await chatService.listMessages(activeConversationId, 50);
        
        // Always update to catch new messages, edits, and deletions
        setMessages(prev => {
          const existing = prev[activeConversationId] || [];
          
          // Check if messages actually changed (compare content, not just count)
          const hasChanges = 
            msgs.length !== existing.length ||
            msgs.some((msg, idx) => {
              const existingMsg = existing[idx];
              return !existingMsg || 
                     msg.$id !== existingMsg.$id || 
                     msg.content !== existingMsg.content ||
                     msg.isEdited !== existingMsg.isEdited;
            });
          
          if (!hasChanges) {
            return prev; // No actual changes, avoid re-render
          }
          
          return { ...prev, [activeConversationId]: msgs };
        });
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [currentUser?.email, activeConversationId, enrichConversation]);

  // Setup WebSocket with polling fallback
  useEffect(() => {
    if (!currentUser?.email) return;

    const setupRealtimeOrPolling = async () => {
      try {
        // Try WebSocket first
        console.log('� Attempting WebSocket connection...');
        await subscribeToConversations();
        await subscribeToPresence();
        await updatePresence(UserStatus.ONLINE);
        
        console.log('✅ WebSocket connected - using real-time updates');
        setUsePolling(false);
        
        // Clear any existing polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } catch (error) {
        // WebSocket failed, use polling fallback
        console.warn('⚠️ WebSocket connection failed, using polling fallback');
        console.warn('Error:', error);
        setUsePolling(true);
        
        // Start polling every 3 seconds
        const intervalId = setInterval(pollForUpdates, 3000);
        pollingIntervalRef.current = intervalId;
      }
    };

    setupRealtimeOrPolling();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentUser?.email, pollForUpdates, subscribeToConversations, subscribeToPresence, updatePresence]);

  // Load conversations on mount
  useEffect(() => {
    if (!currentUser?.email) return;
    
    loadConversations();

    return () => {
      unsubscribeAll();
      
      // Set offline status
      if (currentUser?.email) {
        updatePresence(UserStatus.OFFLINE);
      }
    };
  }, [currentUser?.email]); // Only depend on email to avoid loops

  // Load messages when active conversation changes and subscribe via WebSocket
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
      
      if (usePolling) {
        // If using polling, trigger immediate poll
        pollForUpdates();
      } else {
        // If using WebSocket, subscribe to this conversation
        subscribeToMessages(activeConversationId);
      }
    }

    return () => {
      // Unsubscribe from messages when conversation changes
      if (messagesUnsubscribe && !usePolling) {
        messagesUnsubscribe();
        setMessagesUnsubscribe(null);
      }
    };
  }, [activeConversationId, usePolling]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: ChatContextValue = {
    // State
    conversations,
    messages,
    activeConversationId,
    unreadCounts,
    onlineUsers,
    typingUsers,
    loading,
    error,

    // Actions
    loadConversations,
    setActiveConversation,
    createDirectConversation,
    createGroupConversation,
    updateConversation,
    deleteConversation,
    leaveConversation,
    addParticipants,
    removeParticipant,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    updatePresence,
    setTyping,
    subscribeToConversations,
    subscribeToMessages,
    subscribeToPresence,
    unsubscribeAll,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;
