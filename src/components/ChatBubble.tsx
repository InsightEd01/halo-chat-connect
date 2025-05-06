
import React from 'react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  content: string;
  timestamp: string;
  isOwnMessage: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  timestamp,
  isOwnMessage,
  status = 'sent'
}) => {
  return (
    <div className={cn("mb-4 flex", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn(
        "wispa-chat-bubble",
        isOwnMessage ? "wispa-sent rounded-tr-none" : "wispa-received rounded-tl-none"
      )}>
        <p className="break-words">{content}</p>
        <div className="flex items-center justify-end mt-1 space-x-1">
          <span className={cn(
            "text-xs",
            isOwnMessage ? "text-wispa-100" : "text-gray-500"
          )}>
            {timestamp}
          </span>
          
          {isOwnMessage && (
            <span className="text-xs">
              {status === 'read' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                  <path d="M18 6L7 17L2 12"></path>
                  <path d="M22 10L13 19L11 17"></path>
                </svg>
              )}
              {status === 'delivered' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L7 17L2 12"></path>
                </svg>
              )}
              {status === 'sent' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
