/**
 * MessageBubble Component
 * Displays an individual message in the chat
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageWithSender, MessageType } from '../../types/chat';
import { LA_PRESI_USER } from '../../services/aiService';

interface MessageBubbleProps {
  message: MessageWithSender;
  showAvatar: boolean;
  showSenderName: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar,
  showSenderName,
  onEdit,
  onDelete,
  onReply,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);
  
  // Check if this is an AI message
  const isAIMessage = message.sender.email === LA_PRESI_USER.email;

  const handleEdit = () => {
    if (onEdit && editContent.trim() && editContent !== message.content) {
      onEdit(message.$id, editContent.trim());
    }
    setIsEditing(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isSystemMessage = message.type === MessageType.SYSTEM;

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="text-xs text-white/50 bg-white/5 px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 group ${message.isOwn ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          {message.sender.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {message.sender.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${message.isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name */}
        {showSenderName && !message.isOwn && (
          <span className="text-xs text-white/60 mb-1 px-3">
            {message.sender.name}
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2 ${
            message.isOwn
              ? 'bg-sky-500 text-white rounded-tr-sm'
              : 'bg-white/10 text-white rounded-tl-sm'
          }`}
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          {/* Edit Mode */}
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="bg-white/10 text-white rounded-lg px-2 py-1 outline-none resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Message Content */}
              {isAIMessage ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom styling for markdown elements
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="mb-2 ml-4 list-disc" {...props} />,
                      ol: ({node, ...props}) => <ol className="mb-2 ml-4 list-decimal" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-sky-200" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      code: ({node, inline, ...props}: any) => 
                        inline ? (
                          <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                        ) : (
                          <code className="block bg-white/10 p-2 rounded text-xs font-mono overflow-x-auto" {...props} />
                        ),
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1" {...props} />,
                      a: ({node, ...props}) => <a className="text-sky-300 hover:text-sky-200 underline" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}

              {/* Attachment */}
              {message.attachmentUrl && (
                <div className="mt-2">
                  {message.type === MessageType.IMAGE ? (
                    <img
                      src={message.attachmentUrl}
                      alt={message.attachmentName}
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    <a
                      href={message.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs underline hover:text-sky-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {message.attachmentName}
                    </a>
                  )}
                </div>
              )}

              {/* Message Actions Menu */}
              {showMenu && message.isOwn && (
                <div className={`absolute top-0 ${message.isOwn ? 'right-full mr-2' : 'left-full ml-2'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  {onEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded bg-white/10 hover:bg-white/20"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this message?')) {
                          onDelete(message.$id);
                        }
                      }}
                      className="p-1 rounded bg-red-500/20 hover:bg-red-500/30"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Timestamp and Edit Indicator */}
        <div className="flex items-center gap-2 mt-1 px-3">
          <span className="text-xs text-white/40">
            {formatTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-xs text-white/40 italic">
              (edited)
            </span>
          )}
          {message.isOwn && message.readBy && message.readBy.length > 1 && (
            <span className="text-xs text-sky-400" title="Read">
              ✓✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
