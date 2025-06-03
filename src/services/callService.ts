
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export interface Call {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  status: 'ringing' | 'answered' | 'missed' | 'ended' | 'declined';
  started_at: string;
  ended_at?: string;
  duration?: number;
  caller?: {
    username: string;
    avatar_url: string | null;
  };
  receiver?: {
    username: string;
    avatar_url: string | null;
  };
}

// Fetch call history
export function useCallHistory() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['call-history'],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      // Get calls with profile data using joins
      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          caller:profiles!calls_caller_id_fkey(username, avatar_url),
          receiver:profiles!calls_receiver_id_fkey(username, avatar_url)
        `)
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('started_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching calls:', error);
        throw error;
      }
      
      return (data || []) as Call[];
    },
    enabled: !!user,
  });
}

// Initiate a call
export function useInitiateCall() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      receiverId, 
      callType 
    }: { 
      receiverId: string; 
      callType: 'audio' | 'video';
    }) => {
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: user.id,
          receiver_id: receiverId,
          call_type: callType,
          status: 'ringing',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data as Call;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-history'] });
    },
  });
}

// Answer a call
export function useAnswerCall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (callId: string) => {
      const { data, error } = await supabase
        .from('calls')
        .update({ status: 'answered' })
        .eq('id', callId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data as Call;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-history'] });
    },
  });
}

// End a call
export function useEndCall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      callId, 
      status = 'ended' 
    }: { 
      callId: string; 
      status?: 'ended' | 'declined' | 'missed';
    }) => {
      const endTime = new Date().toISOString();
      
      // Get call start time to calculate duration
      const { data: callData } = await supabase
        .from('calls')
        .select('started_at')
        .eq('id', callId)
        .single();
        
      let duration;
      if (callData && status === 'ended') {
        const startTime = new Date(callData.started_at);
        const endTimeDate = new Date(endTime);
        duration = Math.floor((endTimeDate.getTime() - startTime.getTime()) / 1000);
      }
      
      const { data, error } = await supabase
        .from('calls')
        .update({ 
          status, 
          ended_at: endTime,
          ...(duration && { duration })
        })
        .eq('id', callId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data as Call;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-history'] });
    },
  });
}

// Listen for incoming calls
export function useIncomingCalls() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['incoming-calls'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          caller:profiles!calls_caller_id_fkey(username, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'ringing')
        .order('started_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching incoming calls:', error);
        return [];
      }
      
      return (data || []) as Call[];
    },
    enabled: !!user,
    refetchInterval: 5000, // Check for incoming calls every 5 seconds
  });
}
