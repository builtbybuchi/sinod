/**
 * ConversationList Component
 * Displays the list of conversations in the sidebar
 */

import React, { useState, useMemo } from 'react';
import { ConversationListItem } from '../../types/chat';
import { LA_PRESI_USER, isAIConversation } from '../../services/aiService';

interface ConversationListProps {
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onAIChat?: () => void;
  loading?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onNewGroup,
  onAIChat,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and separate AI conversation
  const { aiConversation, otherConversations } = useMemo(() => {
    const filtered = conversations.filter((conv) =>
      conv.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const ai = filtered.find(conv => isAIConversation(conv.participants));
    const others = filtered.filter(conv => !isAIConversation(conv.participants));
    
    return { aiConversation: ai, otherConversations: others };
  }, [conversations, searchQuery]);

  const filteredConversations = aiConversation 
    ? [aiConversation, ...otherConversations] 
    : otherConversations;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-80 bg-[#0a0a0a] border-r border-white/10 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <div className="flex gap-2">
            <button
              onClick={onNewChat}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="New Chat"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={onNewGroup}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="New Team"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* AI Chat Button */}
        {onAIChat && (
          <button
            onClick={onAIChat}
            className="w-full mb-4 p-3 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transition-colors flex items-center gap-2 justify-center"
          >
            <span className="text-xl">🤖</span>
            <span className="text-white font-medium">Chat with La Presi</span>
          </button>
        )}

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white/5 text-white placeholder-white/40 rounded-lg px-4 py-2 pl-10 outline-none focus:ring-2 focus:ring-sky-500/50"
          />
          <svg
            className="w-5 h-5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg className="w-16 h-16 text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-white/60 mb-2">No conversations yet</p>
            <p className="text-white/40 text-sm">Start a new chat or create a team</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredConversations.map((conversation) => {
              const isAI = isAIConversation(conversation.participants);
              
              return (
                <button
                  key={conversation.$id}
                  onClick={() => onSelectConversation(conversation.$id)}
                  className={`w-full p-4 flex gap-3 hover:bg-white/5 transition-colors text-left relative ${
                    activeConversationId === conversation.$id ? 'bg-white/10' : ''
                  } ${isAI ? 'bg-gradient-to-r from-sky-900/20 to-blue-900/20 border-l-2 border-sky-500' : ''}`}
                >
                  {/* Pin indicator for AI */}
                  {isAI && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative">
                    {conversation.displayAvatar && !isAI ? (
                      <img
                        src={conversation.displayAvatar}
                        alt={conversation.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : isAI ? (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-2xl">
                        🤖
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-medium">
                        {conversation.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {conversation.isOnline && !isAI && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]"></div>
                    )}
                    {isAI && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-sky-500 rounded-full border-2 border-[#0a0a0a]"></div>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-medium truncate ${isAI ? 'text-sky-200' : 'text-white'}`}>
                        {conversation.displayName}
                      </h3>
                      {conversation.lastMessageAt && (
                        <span className="text-xs text-white/40 ml-2 flex-shrink-0">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${isAI ? 'text-sky-300/70' : 'text-white/60'}`}>
                        {conversation.lastMessagePreview || (isAI ? 'Chat with your AI assistant' : 'No messages yet')}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className={`ml-2 text-white text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isAI ? 'bg-sky-500' : 'bg-sky-500'
                        }`}>
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
