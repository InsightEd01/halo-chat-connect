
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from 'uuid';
import { Json } from "@/integrations/supabase/types";

export interface StatusUpdate {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  created_at: string;
  expires_at: string;
  viewed_by: string[];
  user?: {
    username: string;
    avatar_url: string | null;
  };
}

// Fetch all status updates
export function useStatusUpdates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['status-updates'],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('status_updates')
        .select('*, user:profiles!status_updates_user_id_fkey(username, avatar_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Transform data to ensure viewed_by is always a string array
      const processedData = data?.map(status => ({
        ...status,
        viewed_by: Array.isArray(status.viewed_by) 
          ? status.viewed_by.map(id => String(id))
          : []
      })) || [];
      
      return processedData as StatusUpdate[];
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
        .select()
        .single();
        
      if (error) throw error;
      
      // Ensure viewed_by is processed consistently
      const processedData = {
        ...data,
        viewed_by: Array.isArray(data.viewed_by) 
          ? data.viewed_by.map(id => String(id))
          : []
      } as StatusUpdate;
      
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
    mutationFn: async ({ 
      statusId, 
      mediaUrl 
    }: { 
      statusId: string; 
      mediaUrl?: string | null;
    }) => {
      // Delete media from storage if exists
      if (mediaUrl) {
        const mediaPath = mediaUrl.split('/').slice(-2).join('/');
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
  
  return useMutation({
    mutationFn: async ({ statusId }: { statusId: string }) => {
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('status_views')
        .insert({
          status_id: statusId,
          viewer_id: user.id,
        })
        .select()
        .single();
        
      // We're ok with error if it's a uniqueness violation (already viewed)
      if (error && !error.message.includes('unique constraint')) {
        throw error;
      }
      
      return data;
    },
  });
}
