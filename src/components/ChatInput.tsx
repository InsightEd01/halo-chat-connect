
import React, { useState } from 'react';
import { Send, Paperclip, Mic, Smile } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-3 flex items-center border-t">
      <button type="button" className="p-2 text-gray-500 rounded-full hover:bg-gray-100" disabled={disabled}>
        <Smile className="h-6 w-6" />
      </button>
      <button type="button" className="p-2 text-gray-500 rounded-full hover:bg-gray-100" disabled={disabled}>
        <Paperclip className="h-6 w-6" />
      </button>
      <input
        type="text"
        placeholder="Message"
        className="flex-1 border rounded-full py-2 px-4 mx-2 focus:outline-none focus:ring-2 focus:ring-wispa-500"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
      />
      <button 
        type="submit" 
        disabled={!message.trim() || disabled}
        className="p-2 bg-wispa-500 text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
};

export default ChatInput;
