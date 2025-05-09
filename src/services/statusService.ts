// Import the necessary functions and types
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { StatusUpdate, StatusView } from "@/types/status";
import { toast } from "@/components/ui/use-toast";

// Get status updates
export function useStatusUpdates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['status-updates'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Get current user's friends
      const { data: friendships, error: friendshipError } = await supabase
        .rpc('are_friends', { user1_id: user.id, user2_id: user.id });
      
      if (friendshipError) throw friendshipError;
      
      // Get all status updates from friends and the user's own statuses
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('status_updates')
        .select(`
          *,
          user:profiles(username, avatar_url)
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data) return [];
      
      return data.map(status => {
        const userProfile = status.user as any; // Handle potential error type
        return {
          ...status,
          user: {
            username: userProfile?.username || 'Unknown User',
            avatar_url: userProfile?.avatar_url || null
          }
        };
      }) as StatusUpdate[];
    },
    enabled: !!user
  });
}

// Create a status update
export function useCreateStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ content, mediaUrl }: { content?: string, mediaUrl?: string }) => {
      if (!user) throw new Error('User not authenticated');
      if (!content && !mediaUrl) throw new Error('Status must include content or media');
      
      // Calculate expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Create the status update
      const { data, error } = await supabase
        .from('status_updates')
        .insert({
          user_id: user.id,
          content,
          media_url: mediaUrl,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
      toast({
        title: "Status updated",
        description: "Your status has been posted."
      });
    }
  });
}

// Get a specific status update
export function useStatusDetail(statusId: string) {
  return useQuery({
    queryKey: ['status', statusId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_updates')
        .select(`
          *,
          user:profiles(username, avatar_url)
        `)
        .eq('id', statusId)
        .single();
      
      if (error) throw error;
      
      const userProfile = data.user as any; // Handle potential error type
      
      return {
        ...data,
        user: {
          username: userProfile?.username || 'Unknown User',
          avatar_url: userProfile?.avatar_url || null
        }
      } as StatusUpdate;
    },
    enabled: !!statusId
  });
}

// Delete a status update
export function useDeleteStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (statusId: string) => {
      const { data, error } = await supabase
        .from('status_updates')
        .delete()
        .eq('id', statusId);
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
      toast({
        title: "Status deleted",
        description: "Your status has been removed."
      });
    }
  });
}
