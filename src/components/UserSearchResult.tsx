
import React, { useState } from 'react';
import { UserPlus, UserCheck, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSendFriendRequest, useFriendRequestStatus } from '@/services/friendService';
import { useNavigate } from 'react-router-dom';

interface UserSearchResultProps {
  user: {
    id: string;
    username?: string | null;
    avatar_url?: string | null;
    user_id?: string | null;
  };
}

const UserSearchResult: React.FC<UserSearchResultProps> = ({ user }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const { mutate: sendFriendRequest } = useSendFriendRequest();
  const { data: requestStatus, isLoading: isLoadingStatus } = useFriendRequestStatus(user?.id);
  
  // Don't show yourself in search results
  if (user.id === currentUser?.id) return null;
  
  const handleSendFriendRequest = () => {
    if (!user.id) return;
    
    setIsSending(true);
    sendFriendRequest({
      recipientId: user.id
    }, {
      onSuccess: () => {
        toast({
          title: 'Friend request sent',
          description: `Friend request sent to ${user.username || 'User'}`,
        });
        setIsSending(false);
      },
      onError: (error) => {
        console.error('Error sending friend request:', error);
        toast({
          title: 'Error',
          description: 'Failed to send friend request',
          variant: 'destructive',
        });
        setIsSending(false);
      }
    });
  };

  const handleStartChat = () => {
    navigate(`/chat/${user.id}`);
  };

  const renderActionButton = () => {
    if (isLoadingStatus) {
      return (
        <Button variant="outline" size="sm" disabled>
          <UserPlus className="h-4 w-4 mr-1" /> Loading...
        </Button>
      );
    }

    if (requestStatus?.isFriend) {
      return (
        <Button 
          size="sm"
          onClick={handleStartChat}
        >
          <MessageSquare className="h-4 w-4 mr-1" /> Message
        </Button>
      );
    }

    if (requestStatus?.requestSent) {
      return (
        <Button variant="outline" size="sm" disabled>
          <UserCheck className="h-4 w-4 mr-1" /> Request Sent
        </Button>
      );
    }

    if (requestStatus?.requestReceived) {
      return (
        <Button variant="outline" size="sm" disabled>
          <UserCheck className="h-4 w-4 mr-1" /> Request Received
        </Button>
      );
    }

    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleSendFriendRequest}
        disabled={isSending}
      >
        <UserPlus className="h-4 w-4 mr-1" />
        {isSending ? 'Sending...' : 'Add Friend'}
      </Button>
    );
  };

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Avatar 
            src={user.avatar_url || undefined}
            alt={user.username || 'User'}
          >
            <User className="h-5 w-5" />
          </Avatar>
          <div className="ml-3">
            <h3 className="font-medium">{user.username || 'User'}</h3>
            {user.user_id && (
              <p className="text-xs text-gray-500">ID: {user.user_id}</p>
            )}
          </div>
        </div>
        <div>
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default UserSearchResult;
