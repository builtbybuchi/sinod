/**
 * AI Message Component
 * Displays AI assistant messages with streaming text support
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AIMessage as AIMessageType } from '../../services/aiService';
import { Sparkles } from 'lucide-react';

interface AIMessageProps {
  message: AIMessageType;
  isStreaming?: boolean;
}

export const AIMessage: React.FC<AIMessageProps> = ({ message, isStreaming }) => {
  return (
    <div className="flex gap-3 mb-4">
      {/* AI Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 dark:text-white">
            La Presi
          </span>
          {isStreaming && (
            <span className="text-xs text-sky-600 dark:text-sky-400 animate-pulse">
              typing...
            </span>
          )}
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-sky-200 dark:border-sky-800">
          <div className="prose prose-invert prose-sm max-w-none">
            {message.content ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-white" {...props} />,
                  ul: ({node, ...props}) => <ul className="mb-2 ml-4 list-disc text-white" {...props} />,
                  ol: ({node, ...props}) => <ol className="mb-2 ml-4 list-decimal text-white" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-sky-200" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-sky-100" {...props} />,
                  code: ({node, inline, ...props}: any) => 
                    inline ? (
                      <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-sky-100" {...props} />
                    ) : (
                      <code className="block bg-white/10 p-2 rounded text-xs font-mono overflow-x-auto my-2 text-sky-100" {...props} />
                    ),
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-white" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 text-white" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 text-white" {...props} />,
                  a: ({node, ...props}) => <a className="text-sky-300 hover:text-sky-200 underline" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <span className="text-gray-400 italic">Thinking...</span>
            )}
          </div>
          
          {isStreaming && (
            <div className="mt-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
        </div>

        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {new Date(message.createdAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default AIMessage;
