
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Smile, Square, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface ChatInputProps {
  onSendMessage: (message: string, type?: 'text' | 'voice', replyTo?: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  replyTo?: {
    id: string;
    content: string;
    type?: 'text' | 'voice';
    user?: {
      username: string;
    };
  };
  onCancelReply?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  onStartTyping,
  onStopTyping,
  replyTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const debouncedIsTyping = useDebounce(isTyping, 1000);

  useEffect(() => {
    if (onStartTyping && isTyping) {
      onStartTyping();
    } else if (onStopTyping && !isTyping) {
      onStopTyping();
    }
  }, [isTyping, onStartTyping, onStopTyping]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    setIsTyping(newMessage.length > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message, 'text', replyTo?.id);
      setMessage('');
      setIsTyping(false);
      onCancelReply?.();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendMessage(base64Audio, 'voice');
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="border-t p-2 bg-background">
      {replyTo && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-lg mx-2 mb-2">
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-primary">
              Replying to {replyTo.user?.username || 'User'}
            </p>
            <p className="text-sm truncate text-muted-foreground">
              {replyTo.type === 'voice' ? 'Voice message' : replyTo.content}
            </p>
          </div>
          <button 
            onClick={onCancelReply} 
            className="p-1 hover:bg-background rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-1 flex items-center space-x-2">
        <button type="button" className="p-2 text-muted-foreground rounded-full hover:bg-muted" disabled={disabled}>
          <Smile className="h-6 w-6" />
        </button>
        
        {!isRecording ? (
          <>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Message"
                className="w-full bg-muted border-transparent rounded-full py-2 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                value={message}
                onChange={handleMessageChange}
                disabled={disabled}
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground rounded-full hover:bg-background" disabled={disabled}>
                <Paperclip className="h-5 w-5" />
              </button>
            </div>
            
            {message.trim() ? (
              <button 
                type="submit" 
                disabled={!message.trim() || disabled}
                className="p-3 bg-primary text-primary-foreground rounded-full disabled:bg-muted"
              >
                <Send className="h-5 w-5" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={startRecording}
                className="p-3 bg-primary text-primary-foreground rounded-full disabled:bg-muted"
                disabled={disabled}
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-between bg-muted rounded-full px-4 py-2">
            <div className="text-destructive animate-pulse font-medium">Recording...</div>
            <button 
              type="button" 
              onClick={stopRecording}
              className="p-3 bg-destructive text-destructive-foreground rounded-full"
            >
              <Square className="h-5 w-5" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
