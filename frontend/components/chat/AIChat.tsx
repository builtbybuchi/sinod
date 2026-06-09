/**
 * AI Chat Component
 * Main component for chatting with La Presi AI
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  AIMessage as AIMessageType,
  sendAIMessage, 
  listAIMessages,
  subscribeToAIMessages,
  createAIConversation,
  listAIConversations,
  AIConversation
} from '../../services/aiService';
import AIMessage from './AIMessage';
import { Send, Sparkles, Plus, Loader } from 'lucide-react';

interface AIChatProps {
  conversationId?: string;
  eventIds?: string[];
  documentIds?: string[];
}

export const AIChat: React.FC<AIChatProps> = ({ 
  conversationId: initialConversationId,
  eventIds,
  documentIds 
}) => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [messages, setMessages] = useState<AIMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (user?.email) {
      loadConversations();
    }
  }, [user?.email]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages();
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToAIMessages(conversationId, (message) => {
        setMessages(prev => {
          const index = prev.findIndex(m => m.$id === message.$id);
          if (index >= 0) {
            // Update existing message
            const updated = [...prev];
            updated[index] = message;
            return updated;
          } else {
            // Add new message
            return [...prev, message];
          }
        });
      });

      return () => unsubscribe();
    }
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user?.email) return;
    
    try {
      const convos = await listAIConversations(user.email);
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    try {
      const msgs = await listAIMessages(conversationId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    if (!user?.email) return;
    
    try {
      const newConvo = await createAIConversation(user.email);
      setConversationId(newConvo.$id);
      setMessages([]);
      await loadConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user?.email || !user?.name || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      // Create conversation if needed
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const newConvo = await createAIConversation(
          user.email,
          messageText.slice(0, 50),
          eventIds ? 'event' : documentIds ? 'document' : 'general',
          eventIds || documentIds
        );
        currentConversationId = newConvo.$id;
        setConversationId(currentConversationId);
        await loadConversations();
      }

      // Send message with streaming
      await sendAIMessage({
        conversationId: currentConversationId,
        message: messageText,
        userEmail: user.email,
        userName: user.name,
        includeEvents: !!eventIds || true,
        includeDocuments: !!documentIds,
        includeTasks: false,
        eventIds,
        documentIds,
      });

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please log in to chat with La Presi</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">La Presi</h2>
            <p className="text-xs text-gray-500">Your AI Event Assistant</p>
          </div>
        </div>
        
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-16 h-16 text-purple-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Chat with La Presi
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              I can help you with event planning, document creation, scheduling, and more!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.$id}>
                {message.role === 'user' ? (
                  <div className="flex justify-end mb-4">
                    <div className="bg-blue-500 text-white rounded-lg p-3 max-w-[70%]">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <AIMessage 
                    message={message} 
                    isStreaming={message.isStreaming}
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask La Presi anything..."
            disabled={isSending}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;
