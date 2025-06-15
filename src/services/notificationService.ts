
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { type Tables } from '@/integrations/supabase/types';

const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

function showNotification(title: string, options: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
    };
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    requestNotificationPermission();

    if (!audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    }
    
    if (!user) return;

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
        async (payload) => {
          const message = payload.new as Tables<'messages'>;

          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', message.user_id)
            .single();

          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error('Error playing notification sound:', e));
          }
          
          showNotification(profile?.username || 'New Message', {
            body: message.content,
            icon: profile?.avatar_url || '/favicon.ico',
            tag: message.chat_id, // Group notifications by chat to avoid spam
          });
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);
}
