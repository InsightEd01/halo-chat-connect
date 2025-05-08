
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
    <div className="wispa-container">
      <header className="wispa-header">
        <div className="flex items-center">
          <Link to="/chats" className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="font-medium">Friends</h2>
        </div>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 py-2 border-b">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="friends" className="rounded-md">
              <Users className="h-4 w-4 mr-1" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-md">
              <UserCheck className="h-4 w-4 mr-1" />
              Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="add" className="rounded-md">
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="p-3 bg-white border-b">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder={
                activeTab === 'friends' 
                  ? "Search friends..." 
                  : activeTab === 'add' 
                    ? "Search users by name or ID..."
                    : "Search requests..."
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="friends" className="mt-0">
            {isLoadingFriendships ? (
              <div className="flex items-center justify-center h-32">
                <p>Loading friends...</p>
              </div>
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map(friendship => (
                <div key={friendship.id} className="bg-white border rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <Link 
                      to={`/profile/${friendship.friend?.id}`}
                      className="flex items-center flex-1"
                    >
                      <Avatar 
                        src={friendship.friend?.avatar_url || undefined} 
                        alt={friendship.friend?.username || 'User'} 
                        status={null}
                      />
                      <div className="ml-3">
                        <h3 className="font-medium">{friendship.friend?.username}</h3>
                        <p className="text-xs text-gray-500">ID: {friendship.friend?.user_id}</p>
                      </div>
                    </Link>
                    <div className="flex space-x-2">
                      <Link to={`/chat/${friendship.id}`}>
                        <Button 
                          size="sm"
                          className="bg-wispa-500 hover:bg-wispa-600"
                        >
                          Message
                        </Button>
                      </Link>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFriend(friendship.friend?.id || '')}
                        disabled={isRemoving}
                      >
                        <UserX className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No friends found"
                description={
                  searchQuery ? "Try a different search term" : 
                  "Add friends to start chatting with them"
                }
                icon={<Users className="h-12 w-12 mb-4 text-wispa-500" />}
              />
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="mt-0">
            {isLoadingRequests ? (
              <div className="flex items-center justify-center h-32">
                <p>Loading friend requests...</p>
              </div>
            ) : (
              <>
                {pendingRequests.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Incoming Requests</h3>
                    {pendingRequests.map(request => (
                      <FriendRequestCard
                        key={request.id}
                        request={request}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                      />
                    ))}
                  </div>
                )}
                
                {sentRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Sent Requests</h3>
                    {sentRequests.map(request => (
                      <FriendRequestCard
                        key={request.id}
                        request={request}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                        isOutgoing={true}
                      />
                    ))}
                  </div>
                )}
                
                {pendingRequests.length === 0 && sentRequests.length === 0 && (
                  <EmptyState
                    title="No friend requests"
                    description="When you send or receive friend requests, they'll appear here"
                    icon={<UserCheck className="h-12 w-12 mb-4 text-wispa-500" />}
                  />
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="add" className="mt-0">
            {searchResults.length > 0 ? (
              searchResults.map(foundUser => (
                <UserSearchResult key={foundUser.id} user={foundUser} />
              ))
            ) : debouncedQuery ? (
              isSearching ? (
                <div className="flex items-center justify-center h-32">
                  <p>Searching...</p>
                </div>
              ) : (
                <EmptyState
                  title="No users found"
                  description="Try searching with a different name or ID"
                  icon={<Search className="h-12 w-12 mb-4 text-wispa-500" />}
                />
              )
            ) : (
              <EmptyState
                title="Find friends"
                description="Search for users by name or 6-digit ID"
                icon={<UserPlus className="h-12 w-12 mb-4 text-wispa-500" />}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
      
      <NavBar />
    </div>
  );
};

export default Friends;
