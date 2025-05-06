
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { search, plus } from 'lucide-react';
import ChatListItem from '@/components/ChatListItem';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import { Input } from '@/components/ui/input';

// Sample data for demonstration
const sampleChats = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    lastMessage: 'Let me know when you arrive',
    timestamp: '10:45 AM',
    unreadCount: 2,
    status: 'online' as const
  },
  {
    id: '2',
    name: 'Mike Peterson',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    lastMessage: 'The meeting has been rescheduled',
    timestamp: '9:30 AM',
    unreadCount: 0,
    status: 'away' as const
  },
  {
    id: '3',
    name: 'Jennifer Williams',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    lastMessage: 'Thanks for your help yesterday!',
    timestamp: 'Yesterday',
    unreadCount: 0,
    status: 'offline' as const
  },
  {
    id: '4',
    name: 'David Chen',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    lastMessage: 'Did you see the new project requirements?',
    timestamp: 'Yesterday',
    unreadCount: 0,
    status: null
  },
  {
    id: '5',
    name: 'Amy Wilson',
    avatar: 'https://randomuser.me/api/portraits/women/67.jpg',
    lastMessage: 'Let's catch up this weekend!',
    timestamp: 'Wednesday',
    unreadCount: 0,
    status: null
  }
];

const ChatList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter chats based on search query
  const filteredChats = sampleChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <h1 className="text-2xl font-bold">WispaChat</h1>
        <div className="flex space-x-2">
          <button className="p-2 rounded-full hover:bg-wispa-600">
            <search className="h-5 w-5" />
          </button>
        </div>
      </header>
      
      <div className="p-3 bg-white border-b">
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full"
          prefix={<search className="h-4 w-4 text-gray-400" />}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map(chat => (
            <ChatListItem
              key={chat.id}
              id={chat.id}
              name={chat.name}
              avatar={chat.avatar}
              lastMessage={chat.lastMessage}
              timestamp={chat.timestamp}
              unreadCount={chat.unreadCount}
              status={chat.status}
            />
          ))
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
        <plus className="h-6 w-6" />
      </Link>
    </div>
  );
};

export default ChatList;
