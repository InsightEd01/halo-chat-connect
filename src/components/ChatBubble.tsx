import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, Reply, Share2, MoreHorizontal } from 'lucide-react';
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
    <div className={cn("w-full flex mb-2 px-2", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn(
        "relative px-4 py-2 bg-white rounded-2xl shadow max-w-[80%] transition-all",
        isOwnMessage
          ? "bg-wispa-500 text-white rounded-br-md"
          : "bg-white text-wispa-800 rounded-bl-md border"
      )}>
        {/* Reply/forward preview if any */}
        {reply_to_message && (
          <div className={cn(
            "p-2 text-sm border-l-2 ml-1 my-1 rounded",
            isOwnMessage ? "border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground/80" : "border-primary bg-primary/10 text-muted-foreground"
          )}>
            <p className="font-medium text-primary">
              {reply_to_message.user?.username || 'User'}
            </p>
            <p className="truncate">
              {reply_to_message.type === 'voice' ? 'Voice message' : reply_to_message.content}
            </p>
          </div>
        )}
        {type === 'voice' ? (
          // ... show audio player, styled with bg-wispa-100 bar ...
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={cn(
                "p-2 rounded-full",
                isOwnMessage
                  ? "hover:bg-primary/80 text-white"
                  : "hover:bg-muted text-foreground"
              )}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="w-32 h-1 bg-gray-300 dark:bg-gray-600 rounded">
              {audioRef.current && (
                <div
                  className={cn(
                    "h-full rounded",
                    isOwnMessage ? "bg-white" : "bg-primary"
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
          <div className="break-words">{content}</div>
        )}

        {/* bottom row: time, actions */}
        <div className="flex justify-between items-center pt-1">
          {/* reactions on left */}
          <MessageReactions
            reactions={processedReactions}
            onAddReaction={(emoji) => onAddReaction(messageId, emoji)}
            onRemoveReaction={(emoji) => onRemoveReaction(messageId, emoji)}
            isOwnMessage={isOwnMessage}
          />
          {/* actions, time, status */}
          <div className="flex items-center gap-1">
            <button onClick={() => onReply(messageId)} className="text-xs hover:bg-wispa-100 px-2 rounded">
              <Reply className="h-4 w-4" />
            </button>
            {/* actions, forward, dropdowns as needed */}
            <span className="text-xs text-wispa-300">{timestamp}</span>
            {/* status icons for own messages */}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatBubble;
