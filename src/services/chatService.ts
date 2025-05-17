<<<<<<< HEAD

import { supabase } from "@/integrations/supabase/client";
=======
import { supabase } from "@/integrations/supabase/client";                        
>>>>>>> 1e70aa6 (chatService: Fix chat message sending issue)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

// Type definitions
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  user_id: string | null;
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
      
      try {
        // Get all chats with participants, profiles and messages in a single query
        const { data: chats, error: chatsError } = await supabase
          .from('chats')
          .select(`
            *,
            participants:participants!inner(
              user_id,
              user:profiles!participants_user_id_fkey(
                id,
                username,
                avatar_url
              )
            ),
            last_message:messages!messages_chat_id_fkey(
              *,
              user:profiles!messages_user_id_fkey(
                id,
                username,
                avatar_url
              )
            )
          `)
          .eq('participants.user_id', user.id)
          .order('updated_at', { ascending: false })
          .order('last_message.created_at', { foreignTable: 'messages', ascending: false })
          .limit(1, { foreignTable: 'messages' });
          
        if (chatsError) throw chatsError;
        
        if (!chats) return [];
        
        // Transform the data into the expected format
        return chats.map(chat => ({
          id: chat.id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          participants: chat.participants.map(p => p.user),
          lastMessage: chat.last_message?.[0] ? {
            ...chat.last_message[0],
            user: chat.last_message[0].user
          } : undefined
        }));
      } catch (error) {
        console.error('Error fetching chats:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 30, // Cache for 30 seconds
    refetchInterval: 5000, // Check for new messages every 5 seconds
    retry: (failureCount, error) => {
      // Only retry 3 times for non-404 errors
      return failureCount < 3 && !error.message?.includes('404');
    }
  });
}

// Fetch single chat with all messages
export function useChat(chatId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId || !user) throw new Error('No chat ID or user');
      
      try {
        // Get chat with all related data in a single query
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .select(`
            *,
            participants:participants!inner(
              user_id,
              user:profiles!participants_user_id_fkey(
                id,
                username,
                avatar_url
              )
            ),
            messages:messages(
              *,
              user:profiles!messages_user_id_fkey(
                id,
                username,
                avatar_url
              )
            )
          `)
          .eq('id', chatId)
          .order('messages.created_at', { ascending: true })
          .single();
          
        if (chatError) throw chatError;
        
        if (!chat) throw new Error('Chat not found');
        
        // Mark unread messages as read in the background
        const unreadMessages = chat.messages.filter(msg => 
          msg.user_id !== user.id && msg.status !== 'read'
        );
        
        if (unreadMessages.length > 0) {
          // Update message status without triggering a refetch
          const updatePromise = supabase
            .from('messages')
            .update({ status: 'read' })
            .eq('chat_id', chatId)
            .neq('user_id', user.id)
            .neq('status', 'read');
            
          // Don't await this, let it run in background
          updatePromise.then(() => {
            // Update local cache without triggering a refetch
            queryClient.setQueryData(['chat', chatId], (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                messages: oldData.messages.map((msg: Message) => ({
                  ...msg,
                  status: msg.user_id !== user.id ? 'read' : msg.status
                }))
              };
            });
          }).catch(error => {
            console.error('Error marking messages as read:', error);
          });
        }
        
        return {
          id: chat.id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          participants: chat.participants.map(p => p.user),
          messages: chat.messages.map(msg => ({
            ...msg,
            user: msg.user
          }))
        };
      } catch (error) {
        console.error('Error fetching chat:', error);
        throw error;
      }
    },
    enabled: !!chatId && !!user,
    staleTime: 1000 * 10, // Cache for 10 seconds
    refetchInterval: 3000, // Check for new messages every 3 seconds
    retry: (failureCount, error) => {
      // Only retry 3 times for non-404 errors
      return failureCount < 3 && !error.message?.includes('404');
    }
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
        .select(`
          *,
          user:profiles!messages_user_id_fkey (*)
        `)
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
      // Update the chat query data instead of invalidating
      queryClient.setQueriesData(
        { queryKey: ['chat', variables.chatId] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages: [...oldData.messages, _data],
            updated_at: new Date().toISOString()
          };
        }
      );
      
      // Update the chats list query data
      queryClient.setQueriesData(
        { queryKey: ['chats'] },
        (oldData: any[]) => {
          if (!oldData) return oldData;
          return oldData.map(chat => {
            if (chat.id === variables.chatId) {
              return {
                ...chat,
                lastMessage: _data,
                updated_at: new Date().toISOString()
              };
            }
            return chat;
          });
        }
      );
    }
  });
}

// Create a new chat with selected user
export function useCreateChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ participantId }: { participantId: string }) => {
      if (!user) throw new Error('No user');
      
      try {
        // First check if a chat already exists between these users
        const { data: existingChats, error: existingError } = await supabase
          .from('chats')
          .select(`
            id,
            participants!inner (
              user_id
            )
          `)
          .eq('participants.user_id', user.id);
          
        if (existingError) {
          console.error('Error checking existing chats:', existingError);
          throw existingError;
        }
        
        // From these chats, find one where the other user is a participant
        for (const chat of existingChats || []) {
          const { data: otherParticipant, error: participantError } = await supabase
            .from('participants')
            .select('chat_id')
            .eq('chat_id', chat.id)
            .eq('user_id', participantId)
            .single();
            
          if (participantError && participantError.code !== 'PGRST116') {
            console.error('Error checking participant:', participantError);
            continue;
          }
          
          if (otherParticipant) {
            return chat.id; // Chat already exists
          }
        }
        
        // Create new chat
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert({})
          .select()
          .single();
          
        if (chatError) {
          console.error('Error creating chat:', chatError);
          throw chatError;
        }
        
        // Add both participants in a transaction-like operation
        const { error: participantsError } = await supabase
          .from('participants')
          .insert([
            { chat_id: chat.id, user_id: user.id },
            { chat_id: chat.id, user_id: participantId }
          ]);
          
        if (participantsError) {
          // Clean up the chat if participant creation fails
          await supabase
            .from('chats')
            .delete()
            .eq('id', chat.id);
            
          console.error('Error adding participants:', participantsError);
          throw participantsError;
        }
        
        return chat.id;
      } catch (error) {
        console.error('Error creating chat:', error);
        throw error;
      }
    },
    onSuccess: (chatId) => {
      // Fetch the new chat and update the cache
      queryClient.invalidateQueries({ 
        queryKey: ['chats', user?.id],
        exact: true
      });
      queryClient.invalidateQueries({ 
        queryKey: ['chat', chatId],
        exact: true
      });
    }
  });
}

// Search for users by username or user ID (including 6-digit user IDs in user_metadata)
export function useSearchUsers(query: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['users', query],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');
      if (!query || query.trim() === '') return [];
      
      console.log('Searching for users with query:', query);
      
      // For UUID format checking
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
      const isSixDigitId = /^\d{6}$/.test(query);
      
      // Begin with an empty array to store search results
      let results = [];
      
      if (isUuid) {
        console.log('Searching by UUID:', query);
        // Search by exact UUID
        const { data: uuidResults, error: uuidError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', query)
          .neq('id', user.id); // Don't include current user
          
        if (uuidError) throw uuidError;
        
        if (uuidResults && uuidResults.length > 0) {
          results = uuidResults;
        }
      }
      
      // If no results by UUID and it's a 6-digit ID, search by user_id in profiles table
      if (results.length === 0 && isSixDigitId) {
        console.log('Searching by 6-digit ID:', query);
        
<<<<<<< HEAD
        const { data: sixDigitResults, error: sixDigitError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', query)
          .neq('id', user.id); // Don't include current user
=======
        // Using the RPC function to search by user_id in metadata
        const { data: metadataResults, error: metadataError } = await supabase
          .rpc('search_users_by_id', { user_id: query });
>>>>>>> 1e70aa6 (chatService: Fix chat message sending issue)
          
        if (sixDigitError) throw sixDigitError;
        
        if (sixDigitResults && sixDigitResults.length > 0) {
          results = sixDigitResults;
        }
      }
      
      // If still no results, search by username
      if (results.length === 0) {
        console.log('Searching by username:', query);
        const { data: usernameResults, error: usernameError } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', `%${query}%`)
          .neq('id', user.id); // Don't include current user
          
        if (usernameError) throw usernameError;
        
        if (usernameResults) {
          results = usernameResults;
        }
      }
      
      console.log('Search results:', results);
      return results || [];
    },
    enabled: !!user && !!query && query.trim() !== '',
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
}
