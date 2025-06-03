import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useMessageStatus(chatId: string) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !chatId) return;

    // Subscribe to message status changes
    const channel = supabase.channel(`message-status:${chatId}`)
      .on('presence', { event: 'sync' }, () => {
        // Mark messages as delivered when other user is online
        const state = channel.presenceState();
        const otherUserPresent = Object.values(state).some((presence: any) => 
          presence.some((p: any) => p.user_id !== user.id)
        );

        if (otherUserPresent) {
          supabase
            .from('messages')
            .update({ status: 'delivered' })
            .eq('chat_id', chatId)
            .eq('user_id', user.id)
            .eq('status', 'sent');
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [chatId, user]);

  const markMessageAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('id', messageId)
        .neq('user_id', user.id);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return { markMessageAsRead };
}
