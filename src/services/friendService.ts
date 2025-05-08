
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

// Types
export interface FriendRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender?: Profile;
  recipient?: Profile;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: Profile;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  user_id: string | null;
}

// Get all friend requests (sent and received)
export function useFriendRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['friend-requests', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      // Get sent requests
      const { data: sentRequests, error: sentError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:sender_id(id, username, avatar_url, user_id),
          recipient:recipient_id(id, username, avatar_url, user_id)
        `)
        .eq('sender_id', user.id);
        
      if (sentError) throw sentError;
      
      // Get received requests
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:sender_id(id, username, avatar_url, user_id),
          recipient:recipient_id(id, username, avatar_url, user_id)
        `)
        .eq('recipient_id', user.id);
        
      if (receivedError) throw receivedError;
      
      return {
        sent: sentRequests as FriendRequest[],
        received: receivedRequests as FriendRequest[]
      };
    },
    enabled: !!user,
  });
}

// Get all friends
export function useFriendships() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['friendships', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      // Get friends where user is the user_id
      const { data: directFriends, error: directError } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:friend_id(id, username, avatar_url, user_id)
        `)
        .eq('user_id', user.id);
        
      if (directError) throw directError;
      
      // Get friends where user is the friend_id
      const { data: inverseFriends, error: inverseError } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:user_id(id, username, avatar_url, user_id)
        `)
        .eq('friend_id', user.id);
        
      if (inverseError) throw inverseError;
      
      // Combine results to get all friendships
      const allFriends = [
        ...directFriends.map(f => ({
          ...f,
          friend: f.friend
        })),
        ...inverseFriends.map(f => ({
          ...f,
          friend: f.friend
        }))
      ];
      
      return allFriends as Friendship[];
    },
    enabled: !!user,
  });
}

// Send a friend request
export function useSendFriendRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ recipientId }: { recipientId: string }) => {
      if (!user) throw new Error('No user');
      
      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .or(`sender_id.eq.${recipientId},recipient_id.eq.${recipientId}`);
        
      if (checkError) throw checkError;
      
      if (existingRequest && existingRequest.length > 0) {
        throw new Error('A friend request already exists between these users');
      }
      
      // Check if already friends
      const { data: existingFriendship, error: friendshipError } = await supabase
        .rpc('are_friends', {
          user1_id: user.id,
          user2_id: recipientId
        });
        
      if (friendshipError) throw friendshipError;
      
      if (existingFriendship) {
        throw new Error('You are already friends with this user');
      }
      
      // Send friend request
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          status: 'pending'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      toast({
        title: "Friend request sent",
        description: "They'll be notified of your request.",
      });
    },
  });
}

// Respond to a friend request (accept/reject)
export function useRespondToFriendRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      if (!user) throw new Error('No user');
      
      // Get the request details first
      const { data: request, error: requestError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('recipient_id', user.id) // Ensure user is the recipient
        .single();
        
      if (requestError) throw requestError;
      
      if (!request) {
        throw new Error('Friend request not found');
      }
      
      // Update request status
      const newStatus = accept ? 'accepted' : 'rejected';
      
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);
        
      if (updateError) throw updateError;
      
      // If accepted, create friendship entries
      if (accept) {
        const { error: friendshipError } = await supabase
          .from('friendships')
          .insert({
            user_id: user.id,
            friend_id: request.sender_id
          });
          
        if (friendshipError) throw friendshipError;
      }
      
      return { request, status: newStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      
      const actionText = data.status === 'accepted' ? 'accepted' : 'rejected';
      toast({
        title: `Friend request ${actionText}`,
        description: data.status === 'accepted' 
          ? "You are now friends!" 
          : "The friend request has been rejected.",
      });
    },
  });
}

// Remove a friend
export function useRemoveFriend() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ friendId }: { friendId: string }) => {
      if (!user) throw new Error('No user');
      
      // Delete friendship in both directions
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`);
        
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      toast({
        title: "Friend removed",
        description: "This user has been removed from your friends list.",
      });
    },
  });
}

// Check if a user is a friend
export function useFriendshipStatus(userId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['friendship-status', user?.id, userId],
    queryFn: async () => {
      if (!user || !userId) return { isFriend: false, hasPendingRequest: false };
      
      // Check if users are friends
      const { data: isFriend, error: friendError } = await supabase
        .rpc('are_friends', {
          user1_id: user.id,
          user2_id: userId
        });
        
      if (friendError) throw friendError;
      
      // Check if there's a pending friend request
      const { data: sentRequests, error: sentError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('recipient_id', userId);
        
      if (sentError) throw sentError;
      
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', userId)
        .eq('recipient_id', user.id);
        
      if (receivedError) throw receivedError;
      
      const pendingOutgoing = sentRequests && sentRequests.length > 0 && 
                              sentRequests[0].status === 'pending';
                              
      const pendingIncoming = receivedRequests && receivedRequests.length > 0 && 
                             receivedRequests[0].status === 'pending';
      
      return { 
        isFriend: !!isFriend, 
        hasPendingRequest: pendingOutgoing || pendingIncoming,
        pendingRequestDirection: pendingOutgoing ? 'outgoing' : pendingIncoming ? 'incoming' : null,
        pendingRequest: pendingOutgoing ? sentRequests[0] : pendingIncoming ? receivedRequests[0] : null
      };
    },
    enabled: !!user && !!userId,
  });
}
