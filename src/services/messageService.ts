
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

// Add reaction to a message
export function useAddReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      emoji 
    }: { 
      messageId: string; 
      emoji: string;
    }) => {
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          // If reaction already exists, remove it (toggle behavior)
          const { error: deleteError } = await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', user.id)
            .eq('emoji', emoji);

          if (deleteError) throw deleteError;
          return null;
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat']
      });
    },
  });
}

// Remove reaction from a message
export function useRemoveReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      emoji 
    }: { 
      messageId: string; 
      emoji: string;
    }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat']
      });
    },
  });
}

// Update typing status
export function useUpdateTypingStatus() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ chatId }: { chatId: string }) => {
      if (!user) throw new Error('No user');

      const timestamp = Date.now();

      const { data, error } = await supabase
        .from('typing_status')
        .upsert({
          chat_id: chatId,
          user_id: user.id,
          timestamp,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });
}

// Delete a message
export function useDeleteMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      if (!user) throw new Error('No user');

      // Check if user is the message sender
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (messageError) throw messageError;
      if (message.user_id !== user.id) {
        throw new Error('You can only delete your own messages');
      }

      const { data, error } = await supabase
        .from('messages')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          content: '🗑️ This message was deleted'
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat']
      });
    },
  });
}

// Forward a message
export function useForwardMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      messageId,
      targetChatId 
    }: { 
      messageId: string;
      targetChatId: string;
    }) => {
      if (!user) throw new Error('No user');

      // Get original message
      const { data: originalMessage, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (messageError) throw messageError;

      // Check if user has access to target chat
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('chat_id', targetChatId)
        .eq('user_id', user.id)
        .single();

      if (participantError || !participant) {
        throw new Error('You cannot forward to this chat');
      }

      // Create new message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: targetChatId,
          user_id: user.id,
          content: originalMessage.content,
          type: originalMessage.type,
          media_url: originalMessage.media_url,
          file_name: originalMessage.file_name,
          file_size: originalMessage.file_size,
          voice_duration: originalMessage.voice_duration,
          forwarded_from: messageId,
          status: 'sent'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat']
      });
    },
  });
}
