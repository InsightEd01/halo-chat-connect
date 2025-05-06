
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Phone, Video, ArrowLeft, MoreVertical } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';
import { useChat, useSendMessage } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const ChatDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    data: chat, 
    isLoading, 
    isError 
  } = useChat(id);
  
  const { 
    mutate: sendMessage, 
    isPending: isSending 
  } = useSendMessage();

  useEffect(() => {
    // Scroll to bottom of message list when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  // Get the other participant (not current user)
  const otherParticipant = chat?.participants.find(p => p.id !== user?.id);

  const handleSendMessage = (content: string) => {
    if (!id) return;
    
    sendMessage({ chatId: id, content });
  };

  const formatMessageTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'p'); // Format as '12:34 PM'
    } catch (e) {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <div className="wispa-container flex items-center justify-center">
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (isError || !chat || !otherParticipant) {
    return (
      <div className="wispa-container flex items-center justify-center">
        <p>Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <div className="flex items-center">
          <Link to="/chats" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Avatar src={otherParticipant.avatar_url || undefined} alt={otherParticipant.username} status={null} />
          <div className="ml-3">
            <h2 className="font-medium">{otherParticipant.username}</h2>
            <p className="text-xs text-wispa-100">
              {/* We're not tracking online status yet */}
              Last seen recently
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button className="p-2 rounded-full hover:bg-wispa-600">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-wispa-600">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-wispa-600">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {chat.messages.map(message => (
          <ChatBubble
            key={message.id}
            content={message.content}
            timestamp={formatMessageTimestamp(message.created_at)}
            isOwnMessage={message.user_id === user?.id}
            status={message.user_id === user?.id ? message.status : undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
    </div>
  );
};

export default ChatDetail;
