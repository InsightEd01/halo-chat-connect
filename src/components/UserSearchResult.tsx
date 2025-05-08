
import React from 'react';
import { UserPlus, Check, Clock, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { Button } from '@/components/ui/button';
import { useFriendshipStatus, useSendFriendRequest } from '@/services/friendService';
import { useCreateChat } from '@/services/chatService';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  user_id: string | null;
}

interface UserSearchResultProps {
  user: Profile;
}

const UserSearchResult: React.FC<UserSearchResultProps> = ({ user }) => {
  const navigate = useNavigate();
  const { data: friendshipStatus, isLoading: isCheckingStatus } = useFriendshipStatus(user.id);
  const { mutate: sendFriendRequest, isPending: isSendingRequest } = useSendFriendRequest();
  const { mutate: createChat, isPending: isCreatingChat } = useCreateChat();
  
  const handleSendFriendRequest = () => {
    sendFriendRequest({ recipientId: user.id });
  };
  
  const handleStartChat = () => {
    createChat(
      { participantId: user.id },
      {
        onSuccess: (chatId) => {
          navigate(`/chat/${chatId}`);
        }
      }
    );
  };
  
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <Link 
          to={`/profile/${user.id}`} 
          className="flex items-center flex-1"
        >
          <Avatar 
            src={user.avatar_url || undefined} 
            alt={user.username || 'User'} 
            status={null}
          />
          <div className="ml-3">
            <h3 className="font-medium">{user.username}</h3>
            <p className="text-xs text-gray-500">ID: {user.user_id}</p>
          </div>
        </Link>
        
        <div className="flex space-x-2">
          {isCheckingStatus ? (
            <Button size="sm" disabled>Loading...</Button>
          ) : friendshipStatus?.isFriend ? (
            <>
              <Button
                size="sm"
                className="bg-wispa-500 hover:bg-wispa-600"
                onClick={handleStartChat}
                disabled={isCreatingChat}
              >
                <MessageSquare className="h-4 w-4 mr-1" /> Message
              </Button>
            </>
          ) : friendshipStatus?.hasPendingRequest ? (
            friendshipStatus.pendingRequestDirection === 'outgoing' ? (
              <Button size="sm" variant="outline" disabled>
                <Clock className="h-4 w-4 mr-1" /> Request Sent
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="bg-wispa-500 hover:bg-wispa-600"
                onClick={() => navigate('/friends?tab=requests')}
              >
                <Check className="h-4 w-4 mr-1" /> Respond
              </Button>
            )
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartChat}
                disabled={isCreatingChat}
              >
                <MessageSquare className="h-4 w-4 mr-1" /> Message
              </Button>
              <Button 
                size="sm"
                className="bg-wispa-500 hover:bg-wispa-600"
                onClick={handleSendFriendRequest}
                disabled={isSendingRequest}
              >
                <UserPlus className="h-4 w-4 mr-1" /> Add Friend
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchResult;
