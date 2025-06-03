
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreVertical, Settings, User, Archive } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ChatListItem from '@/components/ChatListItem';
import EmptyState from '@/components/EmptyState';
import NavBar from '@/components/NavBar';
import SettingsDialog from '@/components/SettingsDialog';
import { useUserChats } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { data: chats, isLoading } = useUserChats();
  const [showSettings, setShowSettings] = useState(false);

  const handleProfileSettings = () => {
    // Navigate to profile page or open profile settings
    console.log('Open profile settings');
  };

  const handleArchivedChats = () => {
    // Navigate to archived chats
    console.log('Open archived chats');
  };

  if (isLoading) {
    return (
      <div className="wispa-container flex items-center justify-center">
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-wispa-500">WispaChat</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Search className="h-5 w-5" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleProfileSettings}>
                <User className="h-4 w-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchivedChats}>
                <Archive className="h-4 w-4 mr-2" />
                Archived Chats
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        {chats && chats.length > 0 ? (
          chats.map(chat => {
            // Get the other participant (not the current user)
            const otherParticipant = chat.participants.find(p => p.id !== user?.id);
            
            return (
              <ChatListItem
                key={chat.id}
                id={chat.id}
                name={otherParticipant?.username || 'Unknown User'}
                avatar={otherParticipant?.avatar_url}
                userId={otherParticipant?.user_id}
                lastMessage={chat.lastMessage?.content}
                timestamp={chat.lastMessage?.created_at ? new Date(chat.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined}
                unreadCount={0}
                status={null}
              />
            );
          })
        ) : (
          <EmptyState
            title="No conversations yet"
            description="Start a new conversation to see your chats here"
            icon={<div className="h-12 w-12 bg-wispa-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
              </svg>
            </div>}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        to="/new-chat"
        className="fixed bottom-20 right-4 bg-wispa-500 text-white rounded-full p-4 shadow-lg hover:bg-wispa-600 transition-colors z-10"
      >
        <Plus className="h-6 w-6" />
      </Link>
      
      <NavBar />
      
      <SettingsDialog 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};

export default ChatList;
