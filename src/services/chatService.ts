
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

// Type definitions
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Chat {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatWithParticipants extends Chat {
  participants: Profile[];
  lastMessage?: Message;
}

export interface Participant {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  user?: Profile;
}

// Fetch user chats
export function useUserChats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['chats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      // Get all chats the user participates in
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('chat_id')
        .eq('user_id', user.id);
        
      if (participantsError) throw participantsError;
      
      if (!participantsData.length) return [];
      
      const chatIds = participantsData.map(p => p.chat_id);
      
      // Get all chat details
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });
        
      if (chatsError) throw chatsError;
      
      // For each chat, get participants and last message
      const enhancedChats = await Promise.all(
        chats.map(async (chat) => {
          // Get all participants for this chat
          const { data: participants, error: participantsError } = await supabase
            .from('participants')
            .select('user_id')
            .eq('chat_id', chat.id);
            
          if (participantsError) throw participantsError;
          
          // Get profiles for all participants
          const participantIds = participants.map(p => p.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', participantIds);
            
          if (profilesError) throw profilesError;
          
          // Get last message for this chat
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (messagesError) throw messagesError;
          
          return {
            ...chat,
            participants: profiles,
            lastMessage: messages.length > 0 ? messages[0] : undefined
          };
        })
      );
      
      return enhancedChats;
    },
    enabled: !!user,
  });
}

// Fetch single chat with all messages
export function useChat(chatId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId || !user) throw new Error('No chat ID or user');
      
      // Get chat details
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();
        
      if (chatError) throw chatError;
      
      // Get all participants
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('user_id')
        .eq('chat_id', chatId);
        
      if (participantsError) throw participantsError;
      
      // Get profiles for all participants
      const participantIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', participantIds);
        
      if (profilesError) throw profilesError;
      
      // Get all messages for this chat
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (messagesError) throw messagesError;
      
      // Mark messages as read if they were sent to the current user
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('chat_id', chatId)
        .neq('user_id', user.id)
        .neq('status', 'read');
      
      // Add user info to each message
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const profile = profiles.find(p => p.id === message.user_id);
          return {
            ...message,
            user: profile
          };
        })
      );
      
      return {
        ...chat,
        participants: profiles,
        messages: messagesWithUsers
      };
    },
    enabled: !!chatId && !!user,
  });
}

// Send a message
export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      chatId, 
      content 
    }: { 
      chatId: string; 
      content: string 
    }) => {
      if (!user) throw new Error('No user');
      
      // Insert new message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          content,
          status: 'sent'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
        
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    },
  });
}

// Create a new chat with selected user
export function useCreateChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      participantId 
    }: { 
      participantId: string 
    }) => {
      if (!user) throw new Error('No user');
      
      // First check if a chat already exists with this participant
      const { data: existingParticipants, error: existingError } = await supabase
        .from('participants')
        .select('chat_id')
        .eq('user_id', user.id);
        
      if (existingError) throw existingError;
      
      const chatIds = existingParticipants.map(p => p.chat_id);
      
      if (chatIds.length) {
        const { data: existingChat, error: participantError } = await supabase
          .from('participants')
          .select('chat_id')
          .eq('user_id', participantId)
          .in('chat_id', chatIds);
          
        if (participantError) throw participantError;
        
        if (existingChat.length > 0) {
          return existingChat[0].chat_id; // Chat already exists, return its ID
        }
      }
      
      // Create a new chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({})
        .select()
        .single();
        
      if (chatError) throw chatError;
      
      // Add current user as participant
      const { error: currentUserError } = await supabase
        .from('participants')
        .insert({
          chat_id: chat.id,
          user_id: user.id
        });
        
      if (currentUserError) throw currentUserError;
      
      // Add other user as participant
      const { error: otherUserError } = await supabase
        .from('participants')
        .insert({
          chat_id: chat.id,
          user_id: participantId
        });
        
      if (otherUserError) throw otherUserError;
      
      return chat.id;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    },
  });
}

// Search for users
export function useSearchUsers(query: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['users', query],
    queryFn: async () => {
      if (!user || !query) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id) // Don't include current user
        .ilike('username', `%${query}%`)
        .limit(20);
        
      if (error) throw error;
      
      return data;
    },
    enabled: !!user && query.length > 0,
  });
}
