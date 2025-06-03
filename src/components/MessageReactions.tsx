import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  reactions: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  isOwnMessage: boolean;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
  isOwnMessage,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center space-x-1 mt-1">
        {reactions.map(({ emoji, count, hasReacted }) => (
          <button
            key={emoji}
            onClick={() => hasReacted ? onRemoveReaction(emoji) : onAddReaction(emoji)}
            className={cn(
              "px-2 py-1 rounded-full text-xs flex items-center space-x-1",
              hasReacted ? "bg-wispa-100 text-white" : "bg-gray-100",
              isOwnMessage && !hasReacted && "bg-wispa-600/20"
            )}
          >
            <span>{emoji}</span>
            {count > 1 && <span>{count}</span>}
          </button>
        ))}
        
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            "p-1 rounded-full hover:bg-gray-100",
            isOwnMessage ? "text-wispa-100" : "text-gray-500"
          )}
        >
          <Smile className="h-4 w-4" />
        </button>
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 bg-white rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1">
          {EMOJI_LIST.map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                onAddReaction(emoji);
                setShowEmojiPicker(false);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;
