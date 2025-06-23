import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { StatusUpdate } from "@/types/status";
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

// Fetch status updates
export function useStatusUpdates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['status-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_updates')
        .select(`
          id, user_id, content, media_url, created_at, expires_at,
          user:profiles(username, avatar_url)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Get reactions and views for each status
      const statusWithDetails = await Promise.all(
        (data || []).map(async (status) => {
          const { data: reactions } = await supabase
            .from('status_reactions')
            .select('emoji, user_id')
            .eq('status_id', status.id);

          const reactionMap: Record<string, string[]> = {};
          if (reactions) {
            reactions.forEach((reaction) => {
              if (!reactionMap[reaction.emoji]) {
                reactionMap[reaction.emoji] = [];
              }
              reactionMap[reaction.emoji].push(reaction.user_id);
            });
          }

          const { data: views, count } = await supabase
            .from('status_views')
            .select('viewer_id', { count: 'exact', head: false })
            .eq('status_id', status.id);

          return {
            ...status,
            user: Array.isArray(status.user) ? status.user[0] : status.user,
            reactions: reactionMap,
            views: views?.map((v: any) => v.viewer_id) || [],
            viewCount: count ?? 0,
          };
        })
      );

      return statusWithDetails as StatusUpdate[];
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
        .from('status_views')
        .insert({
          status_id: statusId,
          viewer_id: user.id
        });
      
      if (viewError && !viewError.message.includes('duplicate')) {
        throw viewError;
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
        .from('status_reactions')
        .select('*')
        .eq('status_id', statusId)
        .eq('user_id', user.id)
        .single();
        
      if (existingReaction) {
        // Update existing reaction
        const { error } = await supabase
          .from('status_reactions')
          .update({ emoji })
          .eq('id', existingReaction.id);
          
        if (error) throw error;
      } else {
        // Create new reaction
        const { error } = await supabase
          .from('status_reactions')
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

// Infinite scroll for status updates
export function useInfiniteStatusUpdates(pageSize = 10, viewMode = 'friends') {
  const { user } = useAuth();
  return useInfiniteQuery<StatusUpdate[], Error>({
    queryKey: ['status-updates', viewMode],
    initialPageParam: null,
    queryFn: async ({ pageParam = null }) => {
      let query: PostgrestFilterBuilder<any, any, any> = supabase
        .from('status_updates')
        .select(`
          id, user_id, content, media_url, created_at, expires_at,
          user:profiles(username, avatar_url)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(pageSize);
      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }
      if (viewMode === 'public') {
        query = query.eq('is_public', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StatusUpdate[];
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !Array.isArray(lastPage) || lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
    enabled: !!user,
  });
}
