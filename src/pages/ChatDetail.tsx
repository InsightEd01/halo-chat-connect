
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { phone, video, arrowLeft, moreVertical } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';

// Sample chat data
const getSampleChat = (id: string) => {
  const contacts = {
    '1': {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
      status: 'online' as const,
      messages: [
        { id: '1', content: 'Hey there!', timestamp: '10:30 AM', isOwnMessage: false },
        { id: '2', content: 'Hi Sarah! How are you doing?', timestamp: '10:32 AM', isOwnMessage: true, status: 'read' as const },
        { id: '3', content: "I'm good, thanks for asking. Are we still meeting tomorrow?", timestamp: '10:33 AM', isOwnMessage: false },
        { id: '4', content: 'Yes, definitely! Same time and place?', timestamp: '10:34 AM', isOwnMessage: true, status: 'read' as const },
        { id: '5', content: 'Perfect! Looking forward to it.', timestamp: '10:36 AM', isOwnMessage: false },
        { id: '6', content: 'Let me know when you arrive', timestamp: '10:45 AM', isOwnMessage: false },
      ]
    },
    '2': {
      id: '2',
      name: 'Mike Peterson',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      status: 'away' as const,
      messages: [
        { id: '1', content: 'Hey Mike, did you get my email?', timestamp: '9:15 AM', isOwnMessage: true, status: 'read' as const },
        { id: '2', content: 'Yes, just saw it', timestamp: '9:20 AM', isOwnMessage: false },
        { id: '3', content: 'The meeting has been rescheduled', timestamp: '9:30 AM', isOwnMessage: false },
      ]
    },
    '3': {
      id: '3',
      name: 'Jennifer Williams',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      status: 'offline' as const,
      messages: [
        { id: '1', content: 'Thanks for helping me yesterday with the project!', timestamp: 'Yesterday', isOwnMessage: false },
        { id: '2', content: 'No problem at all! Happy to help anytime.', timestamp: 'Yesterday', isOwnMessage: true, status: 'read' as const },
        { id: '3', content: 'Thanks for your help yesterday!', timestamp: 'Yesterday', isOwnMessage: false },
      ]
    },
    '4': {
      id: '4',
      name: 'David Chen',
      avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
      status: null,
      messages: [
        { id: '1', content: 'Did you see the new project requirements?', timestamp: 'Yesterday', isOwnMessage: false },
        { id: '2', content: 'Yes, there are quite a few changes.', timestamp: 'Yesterday', isOwnMessage: true, status: 'delivered' as const },
      ]
    },
    '5': {
      id: '5',
      name: 'Amy Wilson',
      avatar: 'https://randomuser.me/api/portraits/women/67.jpg',
      status: null,
      messages: [
        { id: '1', content: "Let's catch up this weekend!", timestamp: 'Wednesday', isOwnMessage: false },
        { id: '2', content: "I'd love to! What day works for you?", timestamp: 'Wednesday', isOwnMessage: true, status: 'sent' as const },
      ]
    }
  };

  return contacts[id as keyof typeof contacts];
};

const ChatDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [chat, setChat] = useState(getSampleChat(id || '1'));
  const [messages, setMessages] = useState(chat?.messages || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update chat when ID changes
    setChat(getSampleChat(id || '1'));
    setMessages(getSampleChat(id || '1')?.messages || []);
  }, [id]);

  useEffect(() => {
    // Scroll to bottom of message list
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: `new-${Date.now()}`,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwnMessage: true,
      status: 'sent' as const
    };

    setMessages([...messages, newMessage]);
  };

  if (!chat) {
    return (
      <div className="wispa-container flex items-center justify-center">
        <p>Chat not found</p>
      </div>
    );
  }

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <div className="flex items-center">
          <Link to="/chats" className="mr-2">
            <arrowLeft className="h-5 w-5" />
          </Link>
          <Avatar src={chat.avatar} alt={chat.name} status={chat.status} />
          <div className="ml-3">
            <h2 className="font-medium">{chat.name}</h2>
            <p className="text-xs text-wispa-100">
              {chat.status === 'online' ? 'Online' : 
               chat.status === 'away' ? 'Away' : 
               'Last seen recently'}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button className="p-2 rounded-full hover:bg-wispa-600">
            <phone className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-wispa-600">
            <video className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-wispa-600">
            <moreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map(message => (
          <ChatBubble
            key={message.id}
            content={message.content}
            timestamp={message.timestamp}
            isOwnMessage={message.isOwnMessage}
            status={message.status}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatDetail;
