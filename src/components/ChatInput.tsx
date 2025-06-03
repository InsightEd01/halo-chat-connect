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
    <div className="border-t p-4 space-y-2">
      {replyTo && (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
          <div className="flex-1">
            <p className="text-sm text-gray-500">
              Replying to <span className="font-medium">{replyTo.user?.username || 'User'}</span>
            </p>
            <p className="text-sm truncate">
              {replyTo.type === 'voice' ? 'Voice message' : replyTo.content}
            </p>
          </div>
          <button 
            onClick={onCancelReply} 
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-3 flex items-center border-t">
        <button type="button" className="p-2 text-gray-500 rounded-full hover:bg-gray-100" disabled={disabled}>
          <Smile className="h-6 w-6" />
        </button>
        <button type="button" className="p-2 text-gray-500 rounded-full hover:bg-gray-100" disabled={disabled}>
          <Paperclip className="h-6 w-6" />
        </button>
        
        {!isRecording ? (
          <>
            <input
              type="text"
              placeholder="Message"
              className="flex-1 border rounded-full py-2 px-4 mx-2 focus:outline-none focus:ring-2 focus:ring-wispa-500"
              value={message}
              onChange={handleMessageChange}
              disabled={disabled}
            />
            {!message.trim() ? (
              <button 
                type="button" 
                onClick={startRecording}
                className="p-2 bg-wispa-500 text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={disabled}
              >
                <Mic className="h-5 w-5" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={!message.trim() || disabled}
                className="p-2 bg-wispa-500 text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-between mx-2">
            <div className="text-red-500 animate-pulse">Recording...</div>
            <button 
              type="button" 
              onClick={stopRecording}
              className="p-2 bg-red-500 text-white rounded-full"
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
