
import React, { useState } from 'react';
import { send, paperclip, mic, smile } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-3 flex items-center border-t">
      <button type="button" className="p-2 text-gray-500 rounded-full hover:bg-gray-100">
        <smile className="h-6 w-6" />
      </button>
      <button type="button" className="p-2 text-gray-500 rounded-full hover:bg-gray-100">
        <paperclip className="h-6 w-6" />
      </button>
      <input
        type="text"
        placeholder="Message"
        className="flex-1 border rounded-full py-2 px-4 mx-2 focus:outline-none focus:ring-2 focus:ring-wispa-500"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button 
        type="submit" 
        disabled={!message.trim()}
        className="p-2 bg-wispa-500 text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <send className="h-5 w-5" />
      </button>
    </form>
  );
};

export default ChatInput;
