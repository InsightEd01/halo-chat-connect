
import React, { useState } from 'react';
import { Phone, Video, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallHistory, useInitiateCall } from '@/services/callService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import NavBar from '@/components/NavBar';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import CallInterface from '@/components/CallInterface';

const Calls: React.FC = () => {
  const { user } = useAuth();
  const { data: calls, isLoading } = useCallHistory();
  const initiateMutation = useInitiateCall();
  const [activeCall, setActiveCall] = useState<any>(null);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call: any) => {
    const isIncoming = call.receiver_id === user?.id;
    const isVideo = call.call_type === 'video';
    const isMissed = call.status === 'missed';
    
    if (isVideo) {
      return <Video className={`h-4 w-4 ${isMissed ? 'text-red-500' : 'text-green-500'}`} />;
    }
    
    return <Phone className={`h-4 w-4 ${isMissed ? 'text-red-500' : 'text-green-500'}`} />;
  };

  const getCallDirection = (call: any) => {
    const isIncoming = call.receiver_id === user?.id;
    return isIncoming ? '↓' : '↑';
  };

  const handleCallBack = async (call: any) => {
    const receiverId = call.caller_id === user?.id ? call.receiver_id : call.caller_id;
    
    try {
      const newCall = await initiateMutation.mutateAsync({
        receiverId,
        callType: call.call_type
      });
      
      // Set the active call to show the call interface
      setActiveCall(newCall);
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const handleCallEnd = () => {
    setActiveCall(null);
  };

  // Show call interface if there's an active call
  if (activeCall) {
    return (
      <CallInterface
        call={activeCall}
        isIncoming={false}
        onCallEnd={handleCallEnd}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="wispa-container flex items-center justify-center">
        <p>Loading calls...</p>
      </div>
    );
  }

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <h1 className="text-2xl font-bold text-white">Calls</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        {calls && calls.length > 0 ? (
          calls.map(call => {
            const isIncoming = call.receiver_id === user?.id;
            const contact = isIncoming ? call.caller : call.receiver;
            const contactName = contact?.username || 'Unknown User';
            
            return (
              <div 
                key={call.id}
                className="px-4 py-3 border-b flex items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Avatar 
                  src={contact?.avatar_url} 
                  alt={contactName} 
                />
                
                <div className="flex-1 ml-3">
                  <h3 className="font-medium dark:text-white">{contactName}</h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="mr-1">{getCallDirection(call)}</span>
                    {getCallIcon(call)}
                    <span className="ml-1">
                      {call.status === 'missed' ? (
                        <span className="text-red-500">Missed</span>
                      ) : (
                        <>
                          {call.duration && <span className="mr-2">{formatDuration(call.duration)}</span>}
                          <span>{formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCallBack(call)}
                  disabled={initiateMutation.isPending}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                >
                  {call.call_type === 'video' ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
                </Button>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No call history yet"
            description="Start a conversation and make calls to see your call history here"
            icon={<PhoneCall className="h-12 w-12 mb-4 text-blue-500" />}
          />
        )}
      </div>
      
      <NavBar />
    </div>
  );
};

export default Calls;
