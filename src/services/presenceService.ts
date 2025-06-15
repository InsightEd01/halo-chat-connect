
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type PresenceMap = { [userId: string]: boolean };

export function usePresence(userIds: string[] = []) {
  const [presence, setPresence] = useState<PresenceMap>({});

  useEffect(() => {
    if (!Array.isArray(userIds) || userIds.length === 0) return;
    let isMounted = true;

    // Initial state: all offline
    setPresence(Object.fromEntries(userIds.map(id => [id, false])));

    // Subscribe to online state
    const channel = supabase.channel("wispa-presence", {
      config: { presence: { key: "user-presence" } },
    });

    const handleSync = () => {
      const state = channel.presenceState();
      // Flatten state to userId: boolean
      const nextPresence: PresenceMap = {};
      for (const [key, users] of Object.entries(state)) {
        // key = userId, users = array
        if (userIds.includes(key)) nextPresence[key] = true;
      }
      if (isMounted) setPresence(prev => ({ ...prev, ...nextPresence }));
    };

    channel
      .on("presence", { event: "sync" }, handleSync)
      .on("presence", { event: "join" }, handleSync)
      .on("presence", { event: "leave" }, handleSync)
      .subscribe();

    // Track self (for demo, assume current user is in localStorage)
    const meId = localStorage.getItem("wispa-self-id");
    if (meId && userIds.includes(meId)) {
      channel.subscribe(async status => {
        if (status === "SUBSCRIBED") await channel.track({ userId: meId });
      });
    }

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [JSON.stringify(userIds)]);

  return { presence, isOnline: (id: string) => !!presence[id] };
}
