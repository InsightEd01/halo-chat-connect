
import React, { useState } from 'react';
import { Heart, ThumbsUp, Smile, Angry, CircleX, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReactToStatus } from '@/services/statusService';
import { toast } from '@/components/ui/use-toast';

interface StatusReactionsProps {
  statusId: string;
  reactions: Record<string, string[]>; // emoji -> user_ids
  currentUserId: string;
  className?: string;
}

const REACTION_EMOJIS = [
  { emoji: '❤️', icon: Heart, name: 'love' },
  { emoji: '👍', icon: ThumbsUp, name: 'like' },
  { emoji: '😂', icon: Smile, name: 'laugh' },
  { emoji: '😮', icon: MessageSquare, name: 'wow' },
  { emoji: '😢', icon: CircleX, name: 'sad' },
  { emoji: '😡', icon: Angry, name: 'angry' },
];

const StatusReactions: React.FC<StatusReactionsProps> = ({
  statusId,
  reactions,
  currentUserId,
  className = ''
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const reactMutation = useReactToStatus();

  const handleReaction = async (emoji: string) => {
    try {
      await reactMutation.mutateAsync({ statusId, emoji });
      setShowPicker(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  };

  const getUserReaction = () => {
    for (const [emoji, userIds] of Object.entries(reactions)) {
      if (userIds.includes(currentUserId)) {
        return emoji;
      }
    }
    return null;
  };

  const getTotalReactions = () => {
    return Object.values(reactions).reduce((total, userIds) => total + userIds.length, 0);
  };

  const userReaction = getUserReaction();
  const totalReactions = getTotalReactions();

  return (
    <div className={`relative ${className}`}>
      {/* Reaction Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPicker(!showPicker)}
        className="text-white hover:bg-white/20 flex items-center gap-2"
      >
        {userReaction ? (
          <span className="text-lg">{userReaction}</span>
        ) : (
          <Heart className="h-4 w-4" />
        )}
        {totalReactions > 0 && <span>{totalReactions}</span>}
      </Button>

      {/* Reaction Picker */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-50">
          {REACTION_EMOJIS.map(({ emoji, name }) => (
            <Button
              key={name}
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(emoji)}
              className="h-10 w-10 p-0 hover:bg-gray-100 text-lg"
            >
              {emoji}
            </Button>
          ))}
        </div>
      )}

      {/* Reaction Display */}
      {totalReactions > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(reactions).map(([emoji, userIds]) => (
            userIds.length > 0 && (
              <div
                key={emoji}
                className="bg-white/20 rounded-full px-2 py-1 text-xs text-white flex items-center gap-1"
              >
                <span>{emoji}</span>
                <span>{userIds.length}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusReactions;
