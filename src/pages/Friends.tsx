import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Search, UserCheck, UserX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Avatar from '@/components/Avatar';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import FriendRequestCard from '@/components/FriendRequestCard';
import UserSearchResult from '@/components/UserSearchResult';
import UserCard from '@/components/UserCard';
import { toast } from '@/components/ui/use-toast';
import { 
  useFriendRequests, 
  useFriendships, 
  useRespondToFriendRequest,
  useRemoveFriend
} from '@/services/friendService';
import { useSearchUsers } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';

const Friends: React.FC = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { user } = useAuth();
  
  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { data: friendRequests, isLoading: isLoadingRequests } = useFriendRequests();
  const { data: friendships, isLoading: isLoadingFriendships } = useFriendships();
  const { 
    data: searchResults = [], 
    isLoading: isSearching 
  } = useSearchUsers(activeTab === 'add' ? debouncedQuery : '');
  
  const { mutate: respondToFriendRequest, isPending: isResponding } = useRespondToFriendRequest();
  const { mutate: removeFriend, isPending: isRemoving } = useRemoveFriend();
  
  const handleAcceptRequest = (requestId: string) => {
    respondToFriendRequest({ requestId, accept: true });
  };
  
  const handleRejectRequest = (requestId: string) => {
    respondToFriendRequest({ requestId, accept: false });
  };
  
  const handleRemoveFriend = (friendId: string) => {
    removeFriend({ friendId });
  };

  const filterFriends = (friends = []) => {
    if (!searchQuery.trim() || activeTab !== 'friends') return friends;
    
    return friends.filter(friendship => 
      friendship.friend?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friendship.friend?.user_id?.includes(searchQuery)
    );
  };

  const pendingRequests = friendRequests?.received?.filter(req => req.status === 'pending') || [];
  const sentRequests = friendRequests?.sent?.filter(req => req.status === 'pending') || [];
  const filteredFriends = filterFriends(friendships);

  return (
    <div className="container max-w-3xl mx-auto p-4">
      <NavBar />
      <Tabs defaultValue="friends" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            <Users className="h-4 w-4 mr-2" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="pending">
            <UserCheck className="h-4 w-4 mr-2" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="add">
            <UserPlus className="h-4 w-4 mr-2" />
            Add
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4">
          {isLoadingFriendships ? (
            <div className="flex justify-center">Loading friends...</div>
          ) : filteredFriends && filteredFriends.length > 0 ? (
            <div className="space-y-4">
              {filteredFriends.map((friendship) => (
                <UserCard
                  key={friendship.friend.id}
                  user={friendship.friend}
                  isFriend={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="h-12 w-12 text-gray-400" />}
              title="No friends yet"
              description="When you add friends, they'll show up here."
            />
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {isLoadingRequests ? (
            <div className="flex justify-center">Loading requests...</div>
          ) : pendingRequests && pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => handleAcceptRequest(request.id)}
                  onReject={() => handleRejectRequest(request.id)}
                  isResponding={isResponding}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<UserCheck className="h-12 w-12 text-gray-400" />}
              title="No pending requests"
              description="Friend requests you receive will show up here."
            />
          )}
        </TabsContent>

        <TabsContent value="add" className="mt-4">
          <div className="flex items-center space-x-2 mb-4">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isSearching ? (
            <div className="flex justify-center">Searching users...</div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((user) => (
                <UserSearchResult key={user.id} user={user} />
              ))}
            </div>
          ) : debouncedQuery ? (
            <EmptyState
              icon={<Search className="h-12 w-12 text-gray-400" />}
              title="No users found"
              description="Try searching with a different term."
            />
          ) : (
            <EmptyState
              icon={<UserPlus className="h-12 w-12 text-gray-400" />}
              title="Search for users"
              description="Search by username to find and add new friends."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Friends;
