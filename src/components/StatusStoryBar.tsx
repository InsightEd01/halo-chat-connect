
import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';

interface StatusStoryBarProps {
  statuses: Array<{
    id: string;
    user: {
      username: string;
      avatar_url: string | null;
    };
    isOwn?: boolean;
  }>;
  currentUserId?: string;
  onSelect?: (statusId: string) => void;
  myStatusId?: string;
}

const StatusStoryBar: React.FC<StatusStoryBarProps> = ({
  statuses,
  currentUserId,
  onSelect,
  myStatusId,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto py-3 px-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      {statuses.map((status) => (
        <button
          type="button"
          key={status.id}
          onClick={() => onSelect && onSelect(status.id)}
          className="flex flex-col items-center focus:outline-none hover:scale-105 transition"
        >
          <div className={`relative`}>
            <span
              className={
                "block p-1 rounded-full border-2 border-wispa-500 " +
                (status.isOwn
                  ? "border-dashed"
                  : "border-solid animate-pulse"
                )
              }
            >
              <Avatar
                src={status.user.avatar_url || undefined}
                alt={status.user.username}
                size="lg"
                className=""
              />
            </span>
            {status.isOwn && (
              <span className="absolute bottom-0 right-0 h-4 w-4 bg-wispa-500 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-xs text-white font-bold">+</span>
              </span>
            )}
          </div>
          <span className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-200 truncate w-14 text-center">
            {status.isOwn ? "My Status" : status.user.username}
          </span>
        </button>
      ))}
    </div>
  );
};

export default StatusStoryBar;
