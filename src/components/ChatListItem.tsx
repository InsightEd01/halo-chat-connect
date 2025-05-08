
import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';

interface ChatListItemProps {
  id: string;
  name: string;
  avatar?: string;
  userId?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  status?: 'online' | 'offline' | 'away' | null;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  id,
  name,
  avatar,
  userId,
  lastMessage,
  timestamp,
  unreadCount = 0,
  status
}) => {
  return (
    <Link 
      to={`/chat/${id}`}
      className="px-4 py-3 border-b flex items-center hover:bg-gray-50 transition-colors"
    >
      <Avatar src={avatar} alt={name} status={status} />
      
      <div className="flex-1 ml-3 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-medium truncate">{name}</h3>
          {timestamp && (
            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{timestamp}</span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <div className="flex flex-1 items-center">
            <p className="text-sm text-gray-600 truncate">
              {lastMessage || 'Start a conversation'}
            </p>
            
            {userId && (
              <span className="ml-2 text-xs text-gray-400">
                ID: {userId}
              </span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <span 
              className={cn(
                "ml-2 flex-shrink-0 bg-wispa-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1",
              )}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ChatListItem;
