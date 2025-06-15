import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Video, PhoneCall, Search, MoreVertical, Settings, ArrowLeft } from 'lucide-react';
import { useCallHistory, useInitiateCall } from '@/services/callService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import CallInterface from '@/components/CallInterface';
import SettingsDialog from '@/components/SettingsDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const Calls: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: calls, isLoading } = useCallHistory();
  const initiateMutation = useInitiateCall();
  const [activeCall, setActiveCall] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleCallBack = async (call: any) => {
    const otherUser = call.caller_id === user?.id ? call.receiver : call.caller;
    if (!otherUser) {
      console.error('Could not find other user for call back');
      return;
    }
    
    try {
      const newCall = await initiateMutation.mutateAsync({
        receiverId: otherUser.id,
        callType: call.call_type
      });
      setActiveCall(newCall);
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const handleCallEnd = () => {
    setActiveCall(null);
  };

  const getCallDirectionIcon = (call: any) => {
    const isIncoming = call.receiver_id === user?.id;
    const isMissed = call.status === 'missed';
    const color = isMissed ? 'text-destructive' : (isIncoming ? 'text-green-500' : 'text-primary');

    return (
      <div className={`flex items-center ${color}`}>
        {isIncoming ? (
          <ArrowLeft className="h-4 w-4 mr-1 transform rotate-45" />
        ) : (
          <ArrowLeft className="h-4 w-4 mr-1 transform -rotate-135" />
        )}
      </div>
    );
  };

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
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <p>Loading call history...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Hichat</h1>
        <div className="flex items-center space-x-1">
          <button className="p-2 rounded-full text-muted-foreground hover:bg-muted">
            <Search className="h-5 w-5" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full text-muted-foreground hover:bg-muted">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                Clear call log
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex border-b">
        <button 
          className="flex-1 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/chats')}
        >
          Chats
        </button>
        <button 
          className="flex-1 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/status')}
        >
          Status
        </button>
        <button 
          className="flex-1 py-3 text-center font-medium transition-colors text-primary border-b-2 border-primary"
          onClick={() => navigate('/calls')}
        >
          Calls
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {calls && calls.length > 0 ? (
          calls.map(call => {
            const isIncoming = call.receiver_id === user?.id;
            const contact = isIncoming ? call.caller : call.receiver;
            const contactName = contact?.username || 'Unknown User';
            
            return (
              <div 
                key={call.id}
                className="px-4 py-3 flex items-center hover:bg-muted"
              >
                <Avatar 
                  src={contact?.avatar_url} 
                  alt={contactName} 
                />
                
                <div className="flex-1 ml-3">
                  <h3 className={`font-medium ${call.status === 'missed' && !isIncoming ? 'text-destructive' : ''}`}>{contactName}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {getCallDirectionIcon(call)}
                    <span className="ml-1">
                      {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleCallBack(call)}
                  disabled={initiateMutation.isPending}
                  className="p-2 text-primary hover:bg-primary/10 rounded-full"
                >
                  {call.call_type === 'video' ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
                </button>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No call history"
            description="Your call log is empty. Make a call to get started."
            icon={<PhoneCall className="h-12 w-12 mb-4 text-primary/50" />}
          />
        )}
      </div>
      
      <Link
        to="/new-chat" // This should eventually lead to a new call screen
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-colors z-10"
      >
        <PhoneCall className="h-6 w-6" />
      </Link>
      
      <SettingsDialog 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};

export default Calls;
