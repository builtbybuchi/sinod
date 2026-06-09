/**
 * ChatWindow Component
 * Main chat area displaying messages and input
 */

import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { ConversationListItem, Message } from '../../types/chat';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  conversation: ConversationListItem | null;
  messages: Message[];
  currentUserEmail: string;
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  onEditMessage: (messageId: string, content: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onLoadMore?: () => void;
  onMarkAsRead?: () => void;
  onManageMembers?: () => void;
  typingUsers: string[];
  loading?: boolean;
  hasMore?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserEmail,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onLoadMore,
  onMarkAsRead,
  onManageMembers,
  typingUsers,
  loading = false,
  hasMore = false,
}) => {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageText]);

  const handleSendMessage = async () => {
    if ((!messageText.trim() && selectedFiles.length === 0) || isSending) return;

    const content = messageText.trim();
    const files = [...selectedFiles];
    setMessageText('');
    setSelectedFiles([]);
    setIsSending(true);

    try {
      await onSendMessage(content, files);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(content); // Restore message on error
      setSelectedFiles(files); // Restore files on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter files by size (15MB limit)
    const validFiles = files.filter(file => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 15MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const enrichMessage = (message: Message) => {
    // Use senderId from the message
    const senderEmail = message.senderId;
    
    // Find sender in participants (which is an array of ParticipantInfo in ConversationListItem)
    const sender = (conversation?.otherParticipants || []).find(
      (p) => p.email === senderEmail
    ) || {
      email: senderEmail,
      name: message.senderName || 'Unknown',
      avatar: message.senderAvatar || undefined,
      isOnline: false,
    };

    return {
      ...message,
      sender,
      isOwn: senderEmail === currentUserEmail,
    };
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <svg className="w-24 h-24 text-white/10 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-xl font-medium text-white/60 mb-2">Select a conversation</h3>
          <p className="text-white/40">Choose a conversation from the list to start chatting</p>
        </div>
      </div>
    );
  }

  // Deduplicate messages by $id before enriching
  const uniqueMessages = messages.filter((message, index, self) =>
    index === self.findIndex(m => m.$id === message.$id)
  );
  
  const enrichedMessages = uniqueMessages.map(enrichMessage);

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {conversation.displayAvatar ? (
              <img
                src={conversation.displayAvatar}
                alt={conversation.displayName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-medium">
                {conversation.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {conversation.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]"></div>
            )}
          </div>

          {/* Name and Status */}
          <div>
            <h2 className="font-medium text-white">{conversation.displayName}</h2>
            <p className="text-xs text-white/60">
              {conversation.type === 'group'
                ? `${conversation.otherParticipants?.length || 0} members`
                : conversation.isOnline
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Call">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Video Call">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {/* Manage Members Button (only for group chats) */}
          {conversation.type === 'group' && onManageMembers && (
            <button 
              onClick={onManageMembers}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors" 
              title="Manage Members"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          )}
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Settings">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={onLoadMore}
              className="text-sm text-sky-500 hover:text-sky-400 px-4 py-2 rounded-lg hover:bg-white/5"
            >
              Load more messages
            </button>
          </div>
        )}

        {/* Messages */}
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        ) : enrichedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white/60 mb-2">No messages yet</p>
              <p className="text-white/40 text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {enrichedMessages.map((message, index) => {
              const prevMessage = index > 0 ? enrichedMessages[index - 1] : null;
              const showAvatar =
                !prevMessage || prevMessage.senderId !== message.senderId;
              const showSenderName =
                conversation.type === 'group' && showAvatar && !message.isOwn;

              return (
                <MessageBubble
                  key={message.$id}
                  message={message}
                  showAvatar={showAvatar}
                  showSenderName={showSenderName}
                  onEdit={message.isOwn ? onEditMessage : undefined}
                  onDelete={message.isOwn ? onDeleteMessage : undefined}
                />
              );
            })}
          </div>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 mt-4 text-white/60 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-white truncate max-w-[200px]">{file.name}</span>
                <span className="text-xs text-white/40">({(file.size / 1024).toFixed(1)} KB)</span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 text-red-500 hover:text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
            title="Attach file (max 15MB)"
          >
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full mb-2 right-0 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={350}
                  height={400}
                />
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-white/5 text-white placeholder-white/40 rounded-lg px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-sky-500/50 resize-none max-h-32"
              rows={1}
              disabled={isSending}
            />
            {/* Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
              title="Emoji"
              type="button"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={(!messageText.trim() && selectedFiles.length === 0) || isSending}
            className="p-3 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Send"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
