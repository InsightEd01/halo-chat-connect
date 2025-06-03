
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from 'uuid';
import { StatusUpdate } from "@/types/status";

// Fetch all status updates
export function useStatusUpdates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['status-updates'],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      // Fetch status updates without trying to join profiles
      const { data, error } = await supabase
        .from('status_updates')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      // Transform data to ensure viewed_by and reactions are always arrays/objects
      const processedData = data?.map(status => {
        // Process viewed_by to ensure it's always a string array
        let viewedBy: string[] = [];
        
        if (status.viewed_by === null) {
          viewedBy = [];
        } else if (Array.isArray(status.viewed_by)) {
          viewedBy = status.viewed_by.map(id => String(id));
        } else if (typeof status.viewed_by === 'object') {
          viewedBy = Object.values(status.viewed_by as Record<string, string>).map(id => String(id));
        }

        // Process reactions to ensure it's always an object
        let reactions: Record<string, string[]> = {};
        
        if (status.reactions && typeof status.reactions === 'object') {
          reactions = status.reactions as Record<string, string[]>;
        }

        // Return status without user profile info for now
        return {
          ...status,
          viewed_by: viewedBy,
          reactions,
          user: {
            username: null,
            avatar_url: null
          }
        } as StatusUpdate;
      }) || [];
      
      return processedData;
    },
    enabled: !!user,
  });
}

// Create a status update
export function useCreateStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      content, 
      mediaFile 
    }: { 
      content?: string; 
      mediaFile?: File;
    }) => {
      if (!user) throw new Error('No user');
      
      let mediaUrl = null;
      
      // Upload image if provided
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('status')
          .upload(filePath, mediaFile);
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('status')
          .getPublicUrl(filePath);
          
        mediaUrl = data.publicUrl;
      }
      
      // Create status update
      const { data, error } = await supabase
        .from('status_updates')
        .insert({
          user_id: user.id,
          content: content || null,
          media_url: mediaUrl,
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      // Process data for consistency
      const processedData: StatusUpdate = {
        ...data,
        viewed_by: [],
        reactions: {},
        user: {
          username: null,
          avatar_url: null
        }
      };
      
      return processedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
    },
  });
}

// Delete a status update
export function useDeleteStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (statusId: string) => {
      // Get status details first to get media URL if exists
      const { data: status, error: fetchError } = await supabase
        .from('status_updates')
        .select('media_url')
        .eq('id', statusId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete media from storage if exists
      if (status?.media_url) {
        const mediaPath = status.media_url.split('/').slice(-2).join('/');
        const { error: storageError } = await supabase.storage
          .from('status')
          .remove([mediaPath]);
          
        if (storageError) {
          console.error('Error deleting media:', storageError);
        }
      }
      
      // Delete status from database
      const { error } = await supabase
        .from('status_updates')
        .delete()
        .eq('id', statusId);
        
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
    },
  });
}

// Mark a status as viewed
export function useViewStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ statusId }: { statusId: string }) => {
      if (!user) throw new Error('No user');
      
      console.log('Attempting to mark status as viewed:', { statusId, userId: user.id });
      
      // First check if already viewed to prevent duplicate attempts
      const { data: existingView } = await supabase
        .from('status_views')
        .select('id')
        .eq('status_id', statusId)
        .eq('viewer_id', user.id)
        .maybeSingle();
      
      if (existingView) {
        console.log('Status already viewed, skipping insert');
        return existingView;
      }
      
      // Insert new view record
      const { data, error } = await supabase
        .from('status_views')
        .insert({
          status_id: statusId,
          viewer_id: user.id,
        })
        .select()
        .maybeSingle();
        
      if (error) {
        // If it's a uniqueness violation, that's ok - just means already viewed
        if (error.code === '23505' || error.message.includes('unique')) {
          console.log('Status already viewed (uniqueness constraint)');
          return { id: 'already-viewed' };
        }
        throw error;
      }
      
      console.log('Successfully marked status as viewed');
      
      // Update local data
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
      
      return data;
    },
  });
}

// React to a status
export function useReactToStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ statusId, emoji }: { statusId: string; emoji: string }) => {
      if (!user) throw new Error('No user');
      
      console.log('Adding reaction to status:', { statusId, emoji, userId: user.id });
      
      // Insert reaction record
      const { data, error } = await supabase
        .from('status_reactions')
        .insert({
          status_id: statusId,
          user_id: user.id,
          emoji: emoji,
        })
        .select()
        .maybeSingle();
        
      if (error) {
        // If it's a uniqueness violation for same user/status, update the emoji
        if (error.code === '23505') {
          const { data: updateData, error: updateError } = await supabase
            .from('status_reactions')
            .update({ emoji })
            .eq('status_id', statusId)
            .eq('user_id', user.id)
            .select()
            .single();
            
          if (updateError) throw updateError;
          return updateData;
        }
        throw error;
      }
      
      console.log('Successfully added reaction to status');
      
      // Update local data
      queryClient.invalidateQueries({ queryKey: ['status-updates'] });
      
      return data;
    },
  });
}
