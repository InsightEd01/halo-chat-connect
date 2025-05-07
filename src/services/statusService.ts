
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
      
      const { data, error } = await supabase
        .from('status_updates')
        .select(`
          *,
          profiles!status_updates_user_id_fkey (username, avatar_url)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Transform data to ensure viewed_by is always a string array
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
        
        return {
          ...status,
          viewed_by: viewedBy,
          // Ensure user has the expected shape
          user: status.profiles && {
            username: status.profiles.username || 'Unknown User',
            avatar_url: status.profiles.avatar_url
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
        .select(`
          *,
          profiles!status_updates_user_id_fkey (username, avatar_url)
        `)
        .single();
        
      if (error) throw error;
      
      // Process viewed_by to ensure it's always a string array
      let viewedBy: string[] = [];
      
      if (data.viewed_by === null) {
        viewedBy = [];
      } else if (Array.isArray(data.viewed_by)) {
        viewedBy = data.viewed_by.map(id => String(id));
      } else if (typeof data.viewed_by === 'object') {
        viewedBy = Object.values(data.viewed_by as Record<string, string>).map(id => String(id));
      }
      
      const processedData: StatusUpdate = {
        ...data,
        viewed_by: viewedBy,
        // Ensure user has the expected shape
        user: data.profiles && {
          username: data.profiles.username || 'Unknown User',
          avatar_url: data.profiles.avatar_url
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
