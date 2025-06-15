import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
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
  const navigate = useNavigate();
  const { data: chats, isLoading } = useUserChats();
  const [showSettings, setShowSettings] = useState(false);

  const handleProfileSettings = () => {
    navigate('/profile');
  };

  const handleArchivedChats = () => {
    navigate('/archived-chats');
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
      <header className="wispa-header flex-col items-start py-3 px-4 gap-2">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-black tracking-tight">WispaChat</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-blue-600 bg-blue-500/10 text-white">
              <Search className="h-5 w-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-blue-600 text-white">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg z-50">
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
        </div>
        <div className="w-full mt-2 mb-1">
          <input
            type="search"
            className="w-full p-2 rounded-lg bg-wispa-100 placeholder:text-wispa-500 text-sm focus:outline-none"
            placeholder="Search or start a new chat"
            disabled
          />
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto wispa-content-with-navbar px-0 py-0 bg-wispa-50 dark:bg-gray-950">
        {chats && chats.length > 0 ? (
          <div>
            {chats.map(chat => {
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
            })}
          </div>
        ) : (
          <EmptyState
            title="No conversations yet"
            description="Start a new conversation to see your chats here"
            icon={
              <div className="h-12 w-12 bg-wispa-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                  <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                </svg>
              </div>
            }
          />
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        to="/new-chat"
        className="fixed bottom-20 right-4 bg-wispa-500 text-white rounded-full p-4 shadow-lg hover:bg-wispa-600 transition-colors z-20"
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
