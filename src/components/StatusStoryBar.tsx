
import React from 'react';
import { PlusCircle } from 'lucide-react';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';

interface StatusStoryBarProps {
  stories: Array<{
    id: string;
    user: {
      username: string;
      avatar_url: string | null;
    };
    hasUnviewed?: boolean;
    isOwn?: boolean;
    timestamp?: string;
  }>;
  onStoryClick: (storyId: string) => void;
}

const StatusStoryBar: React.FC<StatusStoryBarProps> = ({
  stories,
  onStoryClick,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto py-3 px-2 bg-white dark:bg-gray-900 rounded-lg">
      {stories.map((story) => (
        <button
          key={story.id}
          onClick={() => onStoryClick(story.id)}
          className="flex flex-col items-center min-w-[72px] focus:outline-none group"
        >
          <div className="relative mb-1">
            <div
              className={cn(
                "p-[2px] rounded-full",
                story.hasUnviewed
                  ? "bg-gradient-to-tr from-blue-500 to-green-500"
                  : story.isOwn
                  ? "bg-gray-200 dark:bg-gray-700"
                  : "bg-gray-200 dark:bg-gray-700",
                "ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-500/50"
              )}
            >
              <div className="relative rounded-full overflow-hidden">
                {story.isOwn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50">
                    <PlusCircle className="w-6 h-6 text-white" />
                  </div>
                )}
                <Avatar
                  user={{ avatar_url: story.user.avatar_url }}
                  size="lg"
                  className={cn(
                    "w-14 h-14",
                    story.isOwn && "opacity-75"
                  )}
                />
              </div>
            </div>
          </div>
          <span className="text-xs truncate w-full text-center dark:text-gray-300">
            {story.isOwn ? "My Status" : story.user.username}
          </span>
          {story.timestamp && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {new Date(story.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default StatusStoryBar;
