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
  is_group: boolean;
  name?: string;
  avatar_url?: string;
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
  role?: 'admin' | 'member';
}

// Simplified interface for reply message previews
export interface ReplyMessagePreview {
  content: string;
  type: 'text' | 'voice';
  user?: {
    username: string;
  };
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'voice';
  media_url?: string;
  reply_to?: string; // ID of the message being replied to
  reply_to_message?: ReplyMessagePreview; // The message being replied to (preview only)
  reactions?: Array<{
    emoji: string;
    userId: string;
    createdAt: string;
  }>;
  user?: Profile;
}

export interface MessageReaction {
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface TypingStatus {
  user_id: string;
  chat_id: string;
  timestamp: number;
}

// Helper function to check if user is a participant in a chat
async function checkUserParticipation(chatId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking participation:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in checkUserParticipation:', error);
    return false;
  }
}

// Fetch user chats
export function useUserChats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['chats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      try {
        console.log('Fetching chats for user:', user.id);
        
        // First get chats where user is a participant
        const { data: userChats, error: chatsError } = await supabase
          .from('participants')
          .select('chat_id')
          .eq('user_id', user.id);
          
        if (chatsError) {
          console.error('Error fetching user participants:', chatsError);
          throw chatsError;
        }
        
        if (!userChats || userChats.length === 0) {
          console.log('No chats found for user');
          return [];
        }
        
        const chatIds = userChats.map(p => p.chat_id);
        console.log('Found chat IDs:', chatIds);
        
        // Get chat details
        const { data: chats, error: chatDetailsError } = await supabase
          .from('chats')
          .select('*')
          .in('id', chatIds)
          .order('updated_at', { ascending: false });
          
        if (chatDetailsError) {
          console.error('Error fetching chat details:', chatDetailsError);
          throw chatDetailsError;
        }
        
        if (!chats || chats.length === 0) {
          console.log('No chat details found');
          return [];
        }
        
        // Get all participants for these chats
        const { data: allParticipants, error: participantsError } = await supabase
          .from('participants')
          .select('chat_id, user_id')
          .in('chat_id', chatIds);
          
        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          throw participantsError;
        }
        
        // Get profiles for all participants
        const allUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', allUserIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }
        
        // Get latest messages for each chat
        const { data: latestMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: false });
          
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          throw messagesError;
        }
        
        // Get profiles for message senders
        const messageUserIds = [...new Set(latestMessages?.map(m => m.user_id) || [])];
        const { data: messageProfiles, error: messageProfilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', messageUserIds);
          
        if (messageProfilesError) {
          console.error('Error fetching message profiles:', messageProfilesError);
          throw messageProfilesError;
        }
        
        // Build the response
        const result = chats.map(chat => {
          const chatParticipants = allParticipants?.filter(p => p.chat_id === chat.id) || [];
          const participantProfiles = chatParticipants
            .map(p => profiles?.find(profile => profile.id === p.user_id))
            .filter(Boolean) as Profile[];
            
          const lastMessage = latestMessages?.find(msg => msg.chat_id === chat.id);
          const lastMessageWithUser = lastMessage ? {
            ...lastMessage,
            user: messageProfiles?.find(p => p.id === lastMessage.user_id)
          } : undefined;
          
          return {
            id: chat.id,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            participants: participantProfiles,
            lastMessage: lastMessageWithUser
          };
        });
        
        console.log('Successfully fetched chats:', result.length);
        return result;
      } catch (error) {
        console.error('[userChats] Error:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 10000,
    retry: (failureCount, error: any) => {
      // Log for audit
      if (error) console.error('[userChats] Retrying after error:', error);
      return failureCount < 3 && (!error?.message || !error?.message.includes('404'));
    },
  });
}

// Fetch single chat with all messages
export function useChat(chatId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      try {
        if (!chatId || !user) throw new Error('No chat ID or user');
        console.log('Fetching chat:', chatId, 'for user:', user.id);
        
        // First check if user is a participant in this chat
        const isParticipant = await checkUserParticipation(chatId, user.id);
        if (!isParticipant) {
          console.log('User is not a participant in chat:', chatId);
          throw new Error('Access denied: You are not a participant in this chat');
        }
        
        // Get chat details - use maybeSingle instead of single
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .maybeSingle();
          
        if (chatError) {
          console.error('Error fetching chat:', chatError);
          throw chatError;
        }
        
        if (!chat) {
          console.log('Chat not found:', chatId);
          throw new Error('Chat not found');
        }
        
        // Get participants
        const { data: participants, error: participantsError } = await supabase
          .from('participants')
          .select('user_id')
          .eq('chat_id', chatId);
          
        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          throw participantsError;
        }
        
        // Get participant profiles
        const userIds = participants?.map(p => p.user_id) || [];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }
        
        // Get messages with reactions and properly structured reply data
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            reactions:message_reactions (
              user_id,
              emoji,
              created_at
            )
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
          
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          throw messagesError;
        }
        
        // Get reply-to messages separately to avoid complex joins
        const replyToIds = messages?.map(m => m.reply_to).filter(Boolean) || [];
        let replyToMessages: any[] = [];
        
        if (replyToIds.length > 0) {
          const { data: replyData, error: replyError } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              type,
              user_id
            `)
            .in('id', replyToIds);
            
          if (!replyError && replyData) {
            replyToMessages = replyData;
          }
        }
        
        // Get profiles for reply message users
        const replyUserIds = [...new Set(replyToMessages.map(m => m.user_id))];
        let replyProfiles: any[] = [];
        
        if (replyUserIds.length > 0) {
          const { data: replyProfileData, error: replyProfileError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', replyUserIds);
            
          if (!replyProfileError && replyProfileData) {
            replyProfiles = replyProfileData;
          }
        }
        
        // Get message sender profiles
        const messageUserIds = [...new Set(messages?.map(m => m.user_id) || [])];
        const { data: messageProfiles, error: messageProfilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', messageUserIds);
          
        if (messageProfilesError) {
          console.error('Error fetching message profiles:', messageProfilesError);
          throw messageProfilesError;
        }
        
        // Mark unread messages as read in the background
        const unreadMessages = messages?.filter(msg => 
          msg.user_id !== user.id && msg.status !== 'read'
        ) || [];
        
        if (unreadMessages.length > 0) {
          // Update message status without blocking - use async IFFE to handle the promise properly
          (async () => {
            try {
              await supabase
                .from('messages')
                .update({ status: 'read' })
                .eq('chat_id', chatId)
                .neq('user_id', user.id)
                .neq('status', 'read');
              
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
            } catch (error) {
              console.error('Error marking messages as read:', error);
            }
          })();
        }
        
        const result = {
          id: chat.id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          participants: profiles || [],
          messages: (messages || []).map(msg => ({
            ...msg,
            user: messageProfiles?.find(p => p.id === msg.user_id),
            reply_to_message: msg.reply_to ? (() => {
              const replyMsg = replyToMessages.find(r => r.id === msg.reply_to);
              if (!replyMsg) return undefined;
              
              const replyUser = replyProfiles.find(p => p.id === replyMsg.user_id);
              return {
                content: replyMsg.content || '',
                type: (replyMsg.type as 'text' | 'voice') || 'text',
                user: replyUser ? { username: replyUser.username || '' } : undefined
              };
            })() : undefined
          }))
        };
        
        console.log('Successfully fetched chat with', result.messages.length, 'messages');
        return result;
      } catch (error) {
        console.error('[useChat] Error:', error);
        throw error;
      }
    },
    enabled: !!chatId && !!user,
    staleTime: 1000 * 5,
    refetchInterval: 2000,
    retry: (failureCount, error: any) => {
      if (error) console.error('[useChat] Retrying after error:', error);
      return failureCount < 3 && (!error?.message?.includes('404') && !error?.message?.includes('Access denied'));
    },
  });
}

// Send a message
export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      chatId, 
      content,
      type = 'text',
      replyTo
    }: { 
      chatId: string; 
      content: string;
      type?: 'text' | 'voice';
      replyTo?: string;
    }) => {
      if (!user) throw new Error('No user');
      try {
        console.log('Sending message to chat:', chatId, 'type:', type);
        
        // Check if user is a participant before sending
        const isParticipant = await checkUserParticipation(chatId, user.id);
        if (!isParticipant) {
          throw new Error('Access denied: You are not a participant in this chat');
        }

        let finalContent = content;
        let mediaUrl = null;

        // If it's a voice message, upload it to storage
        if (type === 'voice') {
          try {
            // Convert base64 to blob
            const base64Data = content.split(',')[1];
            const audioBlob = await fetch(`data:audio/webm;base64,${base64Data}`).then(r => r.blob());
            
            // Upload to Supabase storage
            const fileName = `voice-${Date.now()}.webm`;
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('voice-messages')
              .upload(fileName, audioBlob);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase
              .storage
              .from('voice-messages')
              .getPublicUrl(fileName);

            mediaUrl = publicUrl;
            finalContent = 'Voice message'; // Fallback text
          } catch (error) {
            console.error('Error uploading voice message:', error);
            throw error;
          }
        }
        
        // Insert new message
        const { data, error } = await supabase
          .from('messages')          .insert({
            chat_id: chatId,
            user_id: user.id,
            content: finalContent,
            type,
            media_url: mediaUrl,
            status: 'sent',
            reply_to: replyTo
          })
          .select()
          .single();
          
        if (error) {
          console.error('Error sending message:', error);
          throw error;
        }
        
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
        
        console.log('Message sent successfully');
        return {
          ...data,
          user: profile
        };
      } catch (error) {
        console.error('[useSendMessage] Failed to send:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Update the chat query data
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
    },
    onError: (error) => {
      console.error('[useSendMessage] Mutation failed:', error);
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
        console.log('Creating chat between', user.id, 'and', participantId);
        
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
              .maybeSingle(); // Use maybeSingle instead of single
              
            if (!participantError && otherParticipant) {
              console.log('Chat already exists:', participant.chat_id);
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
        
        console.log('Chat created successfully:', chat.id);
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
    },
    onError: (error) => {
      console.error('Error creating chat:', error);
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

// Add reactions
export function useAddReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
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
        console.error('Error adding reaction:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
    onError: (error) => {
      console.error('[useAddReaction] Mutation failed:', error);
    }
  });
}

// Remove reactions
export function useRemoveReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error('No user');
      
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .match({
          message_id: messageId,
          user_id: user.id,
          emoji
        });

      if (error) {
        console.error('Error removing reaction:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
    onError: (error) => {
      console.error('[useRemoveReaction] Mutation failed:', error);
    }
  });
}
