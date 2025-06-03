import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Profile } from './chatService';

// Create a group chat
export function useCreateGroupChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      name, 
      participantIds,
      avatarUrl 
    }: { 
      name: string;
      participantIds: string[];
      avatarUrl?: string;
    }) => {
      if (!user) throw new Error('No user');
      if (participantIds.length === 0) {
        throw new Error('Group must have at least one other participant');
      }
      
      try {
        // Create new group chat
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert({
            is_group: true,
            name,
            avatar_url: avatarUrl
          })
          .select()
          .single();
          
        if (chatError) throw chatError;
        
        // Add all participants including the creator as admin
        const participants = [
          { 
            chat_id: chat.id, 
            user_id: user.id,
            role: 'admin'
          },
          ...participantIds.map(id => ({
            chat_id: chat.id,
            user_id: id,
            role: 'member'
          }))
        ];
        
        const { error: participantsError } = await supabase
          .from('participants')
          .insert(participants);
          
        if (participantsError) {
          // Clean up the chat if participant creation fails
          await supabase
            .from('chats')
            .delete()
            .eq('id', chat.id);
            
          throw participantsError;
        }
        
        return chat.id;
      } catch (error) {
        console.error('Error creating group chat:', error);
        throw error;
      }
    },
    onSuccess: (chatId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['chats', user?.id]
      });
      queryClient.invalidateQueries({ 
        queryKey: ['chat', chatId]
      });
    }
  });
}

// Add participants to a group chat
export function useAddGroupParticipants() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      chatId, 
      participantIds 
    }: { 
      chatId: string;
      participantIds: string[];
    }) => {
      if (!user) throw new Error('No user');
      
      // Check if user is admin
      const { data: userRole, error: roleError } = await supabase
        .from('participants')
        .select('role')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .single();
        
      if (roleError || userRole?.role !== 'admin') {
        throw new Error('Only admins can add participants');
      }
      
      // Add new participants
      const participants = participantIds.map(id => ({
        chat_id: chatId,
        user_id: id,
        role: 'member'
      }));
      
      const { error: participantsError } = await supabase
        .from('participants')
        .insert(participants);
        
      if (participantsError) throw participantsError;
      
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat', variables.chatId]
      });
    }
  });
}

// Remove participant from a group chat
export function useRemoveGroupParticipant() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      chatId, 
      participantId 
    }: { 
      chatId: string;
      participantId: string;
    }) => {
      if (!user) throw new Error('No user');
      
      // Check if user is admin or removing themselves
      const { data: userRole, error: roleError } = await supabase
        .from('participants')
        .select('role')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .single();
        
      if (roleError) throw roleError;
      
      if (user.id !== participantId && userRole?.role !== 'admin') {
        throw new Error('Only admins can remove other participants');
      }
      
      const { error: removeError } = await supabase
        .from('participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', participantId);
        
      if (removeError) throw removeError;
      
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat', variables.chatId]
      });
    }
  });
}

// Update group chat details
export function useUpdateGroupChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      chatId, 
      name,
      avatarUrl 
    }: { 
      chatId: string;
      name?: string;
      avatarUrl?: string;
    }) => {
      if (!user) throw new Error('No user');
      
      // Check if user is admin
      const { data: userRole, error: roleError } = await supabase
        .from('participants')
        .select('role')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .single();
        
      if (roleError || userRole?.role !== 'admin') {
        throw new Error('Only admins can update group details');
      }
      
      const updates: any = {};
      if (name) updates.name = name;
      if (avatarUrl) updates.avatar_url = avatarUrl;
      
      const { data, error } = await supabase
        .from('chats')
        .update(updates)
        .eq('id', chatId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat', variables.chatId]
      });
      queryClient.invalidateQueries({ 
        queryKey: ['chats']
      });
    }
  });
}
