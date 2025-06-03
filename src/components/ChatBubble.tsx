
import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, Reply, Share2, MoreVertical } from 'lucide-react';
import MessageReactions from './MessageReactions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatBubbleProps {
  content: string;
  timestamp: string;
  isOwnMessage: boolean;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'voice';
  messageId: string;
  reactions?: Array<{
    emoji: string;
    userId: string;
    createdAt: string;
  }>;
  currentUserId?: string;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onReply: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  reply_to_message?: {
    content: string;
    type?: 'text' | 'voice';
    user?: {
      username: string;
    };
  };
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  timestamp,
  isOwnMessage,
  status = 'sent',
  type = 'text',
  messageId,
  reactions = [],
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  onReply,
  onForward,
  reply_to_message
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Process reactions to get counts and user's reaction status
  const processedReactions = Object.entries(
    reactions.reduce((acc: { [key: string]: { count: number; users: string[] } }, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { count: 0, users: [] };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.userId);
      return acc;
    }, {})
  ).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    hasReacted: currentUserId ? data.users.includes(currentUserId) : false
  }));

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(content);
  };

  const handleDeleteMessage = () => {
    // TODO: Implement delete message functionality
    console.log('Delete message:', messageId);
  };

  return (
    <div 
      className={cn("mb-4 flex group", isOwnMessage ? "justify-end" : "justify-start")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn(
        "max-w-[70%] relative",
        "rounded-lg px-4 py-2",
        isOwnMessage 
          ? "bg-wispa-500 text-white rounded-tr-none" 
          : "bg-gray-200 text-gray-900 rounded-tl-none"
      )}>
        {reply_to_message && (
          <div className={cn(
            "p-2 text-sm border-l-2 mx-2 mt-2 mb-2",
            isOwnMessage ? "border-wispa-300 text-wispa-100" : "border-gray-400 text-gray-600"
          )}>
            <p className="font-medium">
              {reply_to_message.user?.username || 'User'} • {reply_to_message.type === 'voice' ? 'Voice message' : reply_to_message.content}
            </p>
          </div>
        )}

        {type === 'voice' ? (
          <div className="flex items-center space-x-2">
            <button 
              onClick={togglePlay}
              className={cn(
                "p-2 rounded-full",
                isOwnMessage 
                  ? "hover:bg-wispa-600 text-white" 
                  : "hover:bg-gray-300 text-gray-900"
              )}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="w-32 h-1 bg-gray-300 rounded">
              {audioRef.current && (
                <div 
                  className={cn(
                    "h-full rounded",
                    isOwnMessage ? "bg-white" : "bg-wispa-500"
                  )}
                  style={{ 
                    width: `${(audioRef.current.currentTime / audioRef.current.duration) * 100}%` 
                  }}
                />
              )}
            </div>
            <audio 
              ref={audioRef} 
              src={content} 
              onEnded={handleAudioEnded} 
              className="hidden"
            />
          </div>
        ) : (
          <p className="break-words">{content}</p>
        )}
        
        {/* Actions and timestamp container */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-1">
            {/* Message reactions */}
            {onAddReaction && onRemoveReaction && (
              <MessageReactions
                reactions={processedReactions}
                onAddReaction={(emoji) => onAddReaction(messageId, emoji)}
                onRemoveReaction={(emoji) => onRemoveReaction(messageId, emoji)}
                isOwnMessage={isOwnMessage}
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Action buttons - show on hover */}
            <div className={cn(
              "flex items-center space-x-1 transition-opacity",
              showActions ? "opacity-100" : "opacity-0"
            )}>
              <button
                onClick={() => onReply(messageId)}
                className={cn(
                  "p-1 rounded-full hover:bg-opacity-10 hover:bg-black",
                  isOwnMessage ? "text-wispa-100" : "text-gray-500"
                )}
              >
                <Reply className="h-3 w-3" />
              </button>

              {onForward && (
                <button
                  onClick={() => onForward(messageId)}
                  className={cn(
                    "p-1 rounded-full hover:bg-opacity-10 hover:bg-black",
                    isOwnMessage ? "text-wispa-100" : "text-gray-500"
                  )}
                >
                  <Share2 className="h-3 w-3" />
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "p-1 rounded-full hover:bg-opacity-10 hover:bg-black",
                      isOwnMessage ? "text-wispa-100" : "text-gray-500"
                    )}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleCopyMessage}>
                    Copy message
                  </DropdownMenuItem>
                  {isOwnMessage && (
                    <DropdownMenuItem onClick={handleDeleteMessage} className="text-red-600">
                      Delete message
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Timestamp */}
            <span className={cn(
              "text-xs",
              isOwnMessage ? "text-wispa-100" : "text-gray-500"
            )}>
              {timestamp}
            </span>
            
            {/* Status indicators for own messages */}
            {isOwnMessage && (
              <span className="text-xs">
                {status === 'read' && (
                  <svg className="h-4 w-4 text-wispa-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12L7 17L15 7M22 7L15 17L14 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {status === 'delivered' && (
                  <svg className="h-4 w-4 text-wispa-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12L7 17L15 7M22 7L15 17L14 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {status === 'sent' && (
                  <svg className="h-4 w-4 text-wispa-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
