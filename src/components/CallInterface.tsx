
import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Speaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEndCall } from '@/services/callService';
import { Call } from '@/services/callService';
import Avatar from './Avatar';
import Peer from 'simple-peer';

interface CallInterfaceProps {
  call: Call;
  isIncoming?: boolean;
  onCallEnd: () => void;
}

const CallInterface: React.FC<CallInterfaceProps> = ({
  call,
  isIncoming = false,
  onCallEnd
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call.call_type === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const endCallMutation = useEndCall();

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: call.call_type === 'video',
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current && call.call_type === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      
      // Initialize WebRTC peer
      const peer = new Peer({
        initiator: !isIncoming,
        trickle: false,
        stream: stream
      });
      
      peerRef.current = peer;
      
      peer.on('signal', (data) => {
        // In a real implementation, you would send this signal to the other peer
        // through your signaling server (could be Supabase real-time)
        console.log('Signal data:', data);
      });
      
      peer.on('connect', () => {
        console.log('Peer connected');
        setIsConnected(true);
      });
      
      peer.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
      
      peer.on('error', (error) => {
        console.error('Peer error:', error);
      });
      
      // Simulate connection for demo purposes
      setTimeout(() => {
        setIsConnected(true);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to initialize call:', error);
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleEndCall = async () => {
    try {
      await endCallMutation.mutateAsync({ 
        callId: call.id, 
        status: 'ended' 
      });
      cleanup();
      onCallEnd();
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && call.call_type === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const contact = isIncoming ? call.caller : call.receiver;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 text-white flex flex-col">
      {/* Video Container */}
      {call.call_type === 'video' && isConnected ? (
        <div className="flex-1 relative">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          />
          
          {/* Local Video (Picture in Picture) */}
          <div className="absolute top-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          </div>
        </div>
      ) : (
        /* Audio Call UI */
        <div className="flex-1 flex flex-col items-center justify-center">
          <Avatar 
            src={contact?.avatar_url} 
            alt={contact?.username || 'User'} 
            size="lg"
            className="mb-6 w-32 h-32"
          />
          
          <h2 className="text-2xl font-bold mb-2">
            {contact?.username || 'Unknown User'}
          </h2>
          
          <p className="text-gray-300 mb-4">
            {!isConnected ? (
              isIncoming ? 'Incoming call...' : 'Calling...'
            ) : (
              formatDuration(callDuration)
            )}
          </p>
        </div>
      )}

      {/* Call Controls */}
      <div className="p-6 flex justify-center items-center gap-4">
        {/* Mute Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={toggleMute}
          className={`rounded-full w-14 h-14 ${
            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        {/* End Call Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={handleEndCall}
          className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="h-8 w-8" />
        </Button>

        {/* Video Toggle (for video calls) */}
        {call.call_type === 'video' && (
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleVideo}
            className={`rounded-full w-14 h-14 ${
              !isVideoEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>
        )}

        {/* Speaker Toggle */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`rounded-full w-14 h-14 ${
            isSpeakerOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <Speaker className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default CallInterface;
