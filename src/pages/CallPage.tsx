
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Call } from '@/services/callService';
import CallInterface from '@/components/CallInterface';
import { useAuth } from '@/contexts/AuthContext';

const fetchCallDetails = async (callId: string) => {
  const { data, error } = await supabase
    .from('calls')
    .select('*, caller:caller_id(*), receiver:receiver_id(*)')
    .eq('id', callId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as unknown as Call;
};

const CallPage = () => {
  const { id: callId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: call, isLoading, error } = useQuery({
    queryKey: ['call', callId],
    queryFn: () => fetchCallDetails(callId!),
    enabled: !!callId,
  });

  const handleCallEnd = () => {
    navigate('/calls');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading call...</div>;
  }

  if (error || !call) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Call not found or an error occurred.</div>;
  }
  
  const isIncoming = call.receiver_id === user?.id;

  return (
    <CallInterface 
      call={call} 
      onCallEnd={handleCallEnd} 
      isIncoming={isIncoming}
    />
  );
};

export default CallPage;
