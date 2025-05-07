
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, AlertCircle, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { toast } from '@/components/ui/use-toast';
import { useSearchUsers, useCreateChat } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';

const NewChat: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { 
    data: users = [], 
    isLoading,
    error,
    refetch
  } = useSearchUsers(debouncedQuery);
  
  const { 
    mutate: createChat, 
    isPending: isCreatingChat 
  } = useCreateChat();

  const handleSelectUser = (userId: string) => {
    if (isCreatingChat) return;
    
    createChat(
      { participantId: userId },
      {
        onSuccess: (chatId) => {
          navigate(`/chat/${chatId}`);
        },
        onError: (error) => {
          toast({
            title: "Error creating chat",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    );
  };

  // For debugging purposes
  useEffect(() => {
    if (error) {
      console.error("Search error:", error);
    }
  }, [error]);

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <div className="flex items-center">
          <Link to="/chats" className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="font-medium">New Chat</h2>
        </div>
      </header>
      
      <div className="p-3 bg-white border-b">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search users by username or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Searching users...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-red-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Error finding users. Please try again.</p>
            <button 
              onClick={() => refetch()} 
              className="mt-2 px-4 py-2 bg-wispa-500 text-white rounded"
            >
              Retry
            </button>
          </div>
        ) : users.length > 0 ? (
          users.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user.id)}
              disabled={isCreatingChat}
              className="w-full px-4 py-3 border-b flex items-center hover:bg-gray-50 disabled:opacity-50"
            >
              <Avatar src={user.avatar_url || undefined} alt={user.username} status={null} />
              <div className="ml-3 text-left">
                <h3 className="font-medium">{user.username}</h3>
                <p className="text-xs text-gray-500">ID: {user.id}</p>
              </div>
            </button>
          ))
        ) : debouncedQuery ? (
          <EmptyState
            title="No users found"
            description="Try searching with a different username or ID"
            icon={<UserPlus className="h-12 w-12 mb-4 text-wispa-500" />}
          />
        ) : (
          <EmptyState
            title="Search for users"
            description="Enter a username or user ID to find people to chat with"
          />
        )}
      </div>
    </div>
  );
};

export default NewChat;
