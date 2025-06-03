import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Message } from './chatService';

const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

export function useNotifications() {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notifications
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    
    if (!user) return;

    // Subscribe to new messages channel
    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=neq.${user.id}`,
        },
        (payload) => {
          const message = payload.new as Message;
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
}
