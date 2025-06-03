import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export function useTypingStatus(chatId: string) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !chatId) return;

    // Subscribe to typing status changes
    const channel = supabase.channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers(current => {
          const { userId, isTyping } = payload;
          if (userId === user.id) return current;
          
          if (isTyping && !current.includes(userId)) {
            return [...current, userId];
          } else if (!isTyping) {
            return current.filter(id => id !== userId);
          }
          return current;
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [chatId, user]);

  const setTyping = async (isTyping: boolean) => {
    if (!user || !chatId) return;

    try {
      await supabase.channel(`typing:${chatId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping }
      });
    } catch (error) {
      console.error('Error sending typing status:', error);
    }
  };

  return {
    typingUsers,
    setTyping
  };
}
