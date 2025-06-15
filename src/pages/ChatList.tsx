
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Search, MoreVertical, Settings, User, Archive } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ChatListItem from '@/components/ChatListItem';
import EmptyState from '@/components/EmptyState';
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
  const [activeTab, setActiveTab] = useState('chats');

  const handleProfileSettings = () => {
    navigate('/profile');
  };

  const handleArchivedChats = () => {
    navigate('/archived-chats');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Hichat</h1>
        <div className="flex items-center space-x-1">
          <button className="p-2 rounded-full text-muted-foreground hover:bg-muted">
            <Search className="h-5 w-5" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full text-muted-foreground hover:bg-muted">
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

      {/* Tabs */}
      <div className="flex border-b">
        <button 
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'chats' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('chats')}
        >
          Chats
        </button>
        <button 
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'status' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => navigate('/status')}
        >
          Status
        </button>
        <button 
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'calls' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => navigate('/calls')}
        >
          Calls
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <>
            {chats && chats.length > 0 ? (
              chats.map(chat => {
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
                icon={<div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                    <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                  </svg>
                </div>}
              />
            )}
          </>
        )}
      </div>

      {activeTab === 'chats' && (
        <Link
          to="/new-chat"
          className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-colors z-10"
        >
          <MessageSquare className="h-6 w-6" />
        </Link>
      )}
      
      <SettingsDialog 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};

export default ChatList;
