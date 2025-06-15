
import React, { useState } from 'react';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ChatListItem from '@/components/ChatListItem';
import EmptyState from '@/components/EmptyState';
import { useUserChats } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { data: chats, isLoading } = useUserChats();
  const [activeTab, setActiveTab] = useState('chats');
  const navigate = useNavigate();

  return (
    <div className="wispa-container">
      {/* Header */}
      <header className="wispa-header">
        <div>
          <span className="text-xl font-bold text-wispa-500">Hichat</span>
        </div>
        <div className="flex gap-1 ml-auto">
          <button className="p-2 rounded-full text-wispa-400 hover:bg-wispa-100">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full text-wispa-400 hover:bg-wispa-100">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>
      {/* Tabs */}
      <div className="wispa-tabs text-sm">
        <button
          className={`wispa-tab ${activeTab === 'chats' ? 'wispa-tab-active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >Chats</button>
        <button
          className={`wispa-tab ${activeTab === 'status' ? 'wispa-tab-active' : ''}`}
          onClick={() => navigate('/status')}
        >Status</button>
        <button
          className={`wispa-tab ${activeTab === 'calls' ? 'wispa-tab-active' : ''}`}
          onClick={() => navigate('/calls')}
        >Calls</button>
      </div>
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto wispa-content-with-navbar">
        {isLoading ? (
          <div className="flex justify-center py-12">Loading chats...</div>
        ) : (
          chats && chats.length > 0 ? chats.map(chat => {
            const other = chat.participants.find((p: any) => p.id !== user?.id);
            return (
              <ChatListItem
                key={chat.id}
                id={chat.id}
                name={other?.username || 'Unknown'}
                avatar={other?.avatar_url}
                lastMessage={chat.lastMessage?.content}
                timestamp={chat.lastMessage?.created_at && new Date(chat.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                unreadCount={0}
              />
            );
          }) : (
            <EmptyState
              title="No chats yet"
              description="Start a conversation with the blue plus button!"
            />
          )
        )}
      </div>
      {/* Floating Action */}
      <Link
        to="/new-chat"
        className="absolute right-6 bottom-24 z-20 shadow-lg bg-wispa-500 text-white p-4 rounded-full hover:bg-wispa-700"
      >
        <Plus className="h-6 w-6" />
      </Link>
      <NavBar />
    </div>
  );
};

export default ChatList;
