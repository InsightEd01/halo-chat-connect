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
import NavBar from '@/components/NavBar';

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

  // Render "Recent statuses"
  const renderStatusRow = () => (
    <div className="flex items-center px-4 py-3 bg-white dark:bg-card/30 rounded-xl my-3 shadow-sm">
      <Avatar
        src={user?.avatar_url}
        alt={user?.username}
        size="lg"
        className="border-2 border-primary"
        status="online"
      />
      <div className="ml-3 flex-1">
        <div className="text-sm text-muted-foreground">Your Status</div>
        <div className="font-bold">{user?.username || 'You'}</div>
      </div>
      <Link to="/status" className="ml-auto btn text-primary font-medium">View</Link>
    </div>
  );

  // Render updated chat card style
  const renderChatCard = (chat: any) => {
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
        unreadCount={chat.unreadCount ?? 0}
        status={otherParticipant?.status ?? null}
      />
    );
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
      <header className="px-6 py-3 flex items-center justify-between bg-white dark:bg-card/30 shadow-sm border-b">
        <div className="flex items-center gap-2">
          <Avatar src={user?.avatar_url} alt={user?.username} size="md"/>
          <h1 className="text-xl font-black bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent tracking-wider">WispaChat</h1>
        </div>
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
      <div className="flex border-b sticky top-0 bg-white dark:bg-card/30 z-10">
        <button 
          className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'chats' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('chats')}
        >Chats</button>
        <button 
          className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'status' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => {
            setActiveTab('status');
            navigate('/status');
          }}
        >Status</button>
        <button 
          className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'calls' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => {
            setActiveTab('calls');
            navigate('/calls');
          }}
        >Calls</button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-24 bg-muted">
        {activeTab === 'chats' && (
          <>
            {renderStatusRow()}
            <div className="mt-2 space-y-2">
              {chats && chats.length > 0 ? (
                chats.map(renderChatCard)
              ) : (
                <EmptyState
                  title="No conversations yet"
                  description="Start a new conversation to see your chats here"
                  icon={<div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                    <MessageSquare className="h-6 w-6" />
                  </div>}
                />
              )}
            </div>
          </>
        )}
      </div>

      {activeTab === 'chats' && (
        <Link
          to="/new-chat"
          className="fixed bottom-20 right-6 bg-gradient-to-tr from-orange-500 to-yellow-400 text-white rounded-full p-4 shadow-lg hover:scale-105 transition-all z-10"
        >
          <MessageSquare className="h-7 w-7" />
        </Link>
      )}

      <NavBar />
    </div>
  );
};

export default ChatList;
