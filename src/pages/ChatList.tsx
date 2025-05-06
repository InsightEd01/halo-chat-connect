
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import ChatListItem from '@/components/ChatListItem';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import { Input } from '@/components/ui/input';
import { useUserChats } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const ChatList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { data: chats = [], isLoading, isError } = useUserChats();
  
  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    // Find the other participant (not current user)
    const otherParticipant = chat.participants.find(p => p.id !== user?.id);
    
    if (!otherParticipant) return false;
    
    // Search by username
    return otherParticipant.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: false });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <h1 className="text-2xl font-bold">WispaChat</h1>
        <div className="flex space-x-2">
          <button className="p-2 rounded-full hover:bg-wispa-600">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>
      
      <div className="p-3 bg-white border-b">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Loading conversations...</p>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-32 text-red-500">
            <p>Error loading conversations</p>
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map(chat => {
            // Find the other participant (not current user)
            const otherParticipant = chat.participants.find(p => p.id !== user?.id);
            
            if (!otherParticipant) return null;
            
            return (
              <ChatListItem
                key={chat.id}
                id={chat.id}
                name={otherParticipant.username}
                avatar={otherParticipant.avatar_url || undefined}
                lastMessage={chat.lastMessage?.content}
                timestamp={chat.lastMessage ? formatTimestamp(chat.lastMessage.created_at) : undefined}
                unreadCount={chat.lastMessage && chat.lastMessage.user_id !== user?.id && chat.lastMessage.status !== 'read' ? 1 : 0}
                status={null} // We're not tracking online status yet
              />
            );
          })
        ) : (
          <EmptyState
            title="No conversations found"
            description={searchQuery ? "Try a different search term" : "Start a new conversation by tapping the button below"}
          />
        )}
      </div>
      
      <NavBar />
      
      {/* Floating Action Button */}
      <Link 
        to="/new-chat"
        className="absolute bottom-20 right-6 bg-wispa-500 text-white rounded-full p-4 shadow-lg hover:bg-wispa-600 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
};

export default ChatList;
