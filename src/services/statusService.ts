
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { StatusUpdate } from "@/types/status";

// Fetch status updates
export function useStatusUpdates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['status-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_updates')
        .select(`
          *,
          user:profiles!status_updates_user_id_fkey(username, avatar_url)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Get reactions for each status
      const statusWithReactions = await Promise.all(
        (data || []).map(async (status) => {
          const { data: reactions } = await supabase
            .from('status_reactions' as any)
            .select('emoji, user_id')
            .eq('status_id', status.id);
            
          const reactionMap: Record<string, string[]> = {};
          reactions?.forEach(reaction => {
            if (!reactionMap[reaction.emoji]) {
              reactionMap[reaction.emoji] = [];
            }
            reactionMap[reaction.emoji].push(reaction.user_id);
          });
          
          return {
            ...status,
            reactions: reactionMap
          };
        })
      );
      
      return statusWithReactions as StatusUpdate[];
    },
    enabled: !!user,
  });
}

// Create status update
export function useCreateStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ content, mediaUrl }: { content?: string; mediaUrl?: string }) => {
      if (!user) throw new Error('No user');
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { data, error } = await supabase
        .from('status_updates')
        .insert({
          user_id: user.id,
          content,
          media_url: mediaUrl,
          expires_at: expiresAt.toISOString(),
          viewed_by: []
        })
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
    },
  });
}

// View status
export function useViewStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ statusId }: { statusId: string }) => {
      if (!user) throw new Error('No user');
      
      // Add to status_views table
      const { error: viewError } = await supabase
        .from('status_views' as any)
        .insert({
          status_id: statusId,
          viewer_id: user.id
        });
      
      if (viewError && !viewError.message.includes('duplicate')) {
        throw viewError;
      }
      
      // Update viewed_by array
      const { data: status } = await supabase
        .from('status_updates')
        .select('viewed_by')
        .eq('id', statusId)
        .single();
        
      if (status) {
        const viewedBy = Array.isArray(status.viewed_by) ? status.viewed_by : [];
        if (!viewedBy.includes(user.id)) {
          const { error } = await supabase
            .from('status_updates')
            .update({
              viewed_by: [...viewedBy, user.id]
            })
            .eq('id', statusId);
            
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
    },
  });
}

// React to status
export function useReactToStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ statusId, emoji }: { statusId: string; emoji: string }) => {
      if (!user) throw new Error('No user');
      
      // Check if user already reacted
      const { data: existingReaction } = await supabase
        .from('status_reactions' as any)
        .select('*')
        .eq('status_id', statusId)
        .eq('user_id', user.id)
        .single();
        
      if (existingReaction) {
        // Update existing reaction
        const { error } = await supabase
          .from('status_reactions' as any)
          .update({ emoji })
          .eq('id', existingReaction.id);
          
        if (error) throw error;
      } else {
        // Create new reaction
        const { error } = await supabase
          .from('status_reactions' as any)
          .insert({
            status_id: statusId,
            user_id: user.id,
            emoji
          });
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
    },
  });
}

// Delete status
export function useDeleteStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (statusId: string) => {
      if (!user) throw new Error('No user');
      
      const { error } = await supabase
        .from('status_updates')
        .delete()
        .eq('id', statusId)
        .eq('user_id', user.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
    },
  });
}
