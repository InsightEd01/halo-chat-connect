
import { supabase } from "@/integrations/supabase/client";
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
        // First get chats where user is a participant
        const { data: userChats, error: chatsError } = await supabase
          .from('participants')
          .select('chat_id')
          .eq('user_id', user.id);
          
        if (chatsError) throw chatsError;
        if (!userChats || userChats.length === 0) return [];
        
        const chatIds = userChats.map(p => p.chat_id);
        
        // Get chat details
        const { data: chats, error: chatDetailsError } = await supabase
          .from('chats')
          .select('*')
          .in('id', chatIds)
          .order('updated_at', { ascending: false });
          
        if (chatDetailsError) throw chatDetailsError;
        if (!chats) return [];
        
        // Get all participants for these chats
        const { data: allParticipants, error: participantsError } = await supabase
          .from('participants')
          .select('chat_id, user_id')
          .in('chat_id', chatIds);
          
        if (participantsError) throw participantsError;
        
        // Get profiles for all participants
        const allUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', allUserIds);
          
        if (profilesError) throw profilesError;
        
        // Get latest messages for each chat
        const { data: latestMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*, profiles!messages_user_id_fkey(*)')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: false });
          
        if (messagesError) throw messagesError;
        
        // Build the response
        return chats.map(chat => {
          const chatParticipants = allParticipants?.filter(p => p.chat_id === chat.id) || [];
          const participantProfiles = chatParticipants
            .map(p => profiles?.find(profile => profile.id === p.user_id))
            .filter(Boolean) as Profile[];
            
          const lastMessage = latestMessages?.find(msg => msg.chat_id === chat.id);
          
          return {
            id: chat.id,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            participants: participantProfiles,
            lastMessage: lastMessage ? {
              ...lastMessage,
              user: lastMessage.profiles
            } : undefined
          };
        });
      } catch (error) {
        console.error('Error fetching chats:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 30,
    refetchInterval: 5000,
    retry: (failureCount, error) => {
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
        // Get chat details
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .single();
          
        if (chatError) throw chatError;
        if (!chat) throw new Error('Chat not found');
        
        // Get participants
        const { data: participants, error: participantsError } = await supabase
          .from('participants')
          .select('user_id')
          .eq('chat_id', chatId);
          
        if (participantsError) throw participantsError;
        
        // Get participant profiles
        const userIds = participants?.map(p => p.user_id) || [];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;
        
        // Get messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        
        // Get message sender profiles
        const messageUserIds = [...new Set(messages?.map(m => m.user_id) || [])];
        const { data: messageProfiles, error: messageProfilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', messageUserIds);
          
        if (messageProfilesError) throw messageProfilesError;
        
        // Mark unread messages as read in the background
        const unreadMessages = messages?.filter(msg => 
          msg.user_id !== user.id && msg.status !== 'read'
        ) || [];
        
        if (unreadMessages.length > 0) {
          // Update message status without blocking
          supabase
            .from('messages')
            .update({ status: 'read' })
            .eq('chat_id', chatId)
            .neq('user_id', user.id)
            .neq('status', 'read')
            .then(() => {
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
            })
            .catch(error => {
              console.error('Error marking messages as read:', error);
            });
        }
        
        return {
          id: chat.id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          participants: profiles || [],
          messages: (messages || []).map(msg => ({
            ...msg,
            user: messageProfiles?.find(p => p.id === msg.user_id)
          }))
        };
      } catch (error) {
        console.error('Error fetching chat:', error);
        throw error;
      }
    },
    enabled: !!chatId && !!user,
    staleTime: 1000 * 10,
    refetchInterval: 3000,
    retry: (failureCount, error) => {
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
        .select()
        .single();
        
      if (error) throw error;
      
      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
        
      // Get user profile for the message
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      return {
        ...data,
        user: profile
      };
    },
    onSuccess: (data, variables) => {
      // Update the chat query data instead of invalidating
      queryClient.setQueriesData(
        { queryKey: ['chat', variables.chatId] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages: [...oldData.messages, data],
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
                lastMessage: data,
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
        const { data: existingParticipants, error: existingError } = await supabase
          .from('participants')
          .select('chat_id')
          .eq('user_id', user.id);
          
        if (existingError) {
          console.error('Error checking existing chats:', existingError);
          throw existingError;
        }
        
        // Check if any of these chats also include the other participant
        if (existingParticipants && existingParticipants.length > 0) {
          for (const participant of existingParticipants) {
            const { data: otherParticipant, error: participantError } = await supabase
              .from('participants')
              .select('chat_id')
              .eq('chat_id', participant.chat_id)
              .eq('user_id', participantId)
              .single();
              
            if (!participantError && otherParticipant) {
              return participant.chat_id; // Chat already exists
            }
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
        
        // Add both participants
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
      // Invalidate and refetch queries
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

// Search for users by username or user ID
export function useSearchUsers(query: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['users', query],
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');
      if (!query || query.trim() === '') return [];
      
      console.log('Searching for users with query:', query);
      
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
      const isSixDigitId = /^\d{6}$/.test(query);
      
      let results = [];
      
      if (isUuid) {
        console.log('Searching by UUID:', query);
        const { data: uuidResults, error: uuidError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', query)
          .neq('id', user.id);
          
        if (uuidError) throw uuidError;
        
        if (uuidResults && uuidResults.length > 0) {
          results = uuidResults;
        }
      }
      
      if (results.length === 0 && isSixDigitId) {
        console.log('Searching by 6-digit ID:', query);
        
        const { data: sixDigitResults, error: sixDigitError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', query)
          .neq('id', user.id);
          
        if (sixDigitError) throw sixDigitError;
        
        if (sixDigitResults && sixDigitResults.length > 0) {
          results = sixDigitResults;
        }
      }
      
      if (results.length === 0) {
        console.log('Searching by username:', query);
        const { data: usernameResults, error: usernameError } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', `%${query}%`)
          .neq('id', user.id);
          
        if (usernameError) throw usernameError;
        
        if (usernameResults) {
          results = usernameResults;
        }
      }
      
      console.log('Search results:', results);
      return results || [];
    },
    enabled: !!user && !!query && query.trim() !== '',
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}
