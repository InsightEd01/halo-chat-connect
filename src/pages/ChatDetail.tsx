import React, { useRef, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Phone, Video, ArrowLeft, MoreVertical } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';
import { ForwardMessageDialog } from '@/components/ForwardMessageDialog';
import { useChat, useSendMessage, useAddReaction, useRemoveReaction, Message } from '@/services/chatService';
import { useTypingStatus } from '@/services/typingService';
import { useMessageStatus } from '@/services/messageStatusService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/services/notificationService';
import type { Chat } from '@/services/chatService';

const ChatDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  
  const { 
    data: chat, 
    isLoading, 
    isError,
    error
  } = useChat(id);
  
  const { 
    mutate: sendMessage, 
    isPending: isSending 
  } = useSendMessage();

  const {
    mutate: addReaction,
    isPending: isAddingReaction
  } = useAddReaction();

  const {
    mutate: removeReaction,
    isPending: isRemovingReaction
  } = useRemoveReaction();

  const { typingUsers, setTyping } = useTypingStatus(id || '');
  const { markMessageAsRead } = useMessageStatus(id || '');
  useNotifications(); // Add notifications

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark messages as read when they become visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              markMessageAsRead(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all unread messages from other users
    const unreadMessages = document.querySelectorAll('[data-message-id]');
    unreadMessages.forEach(msg => observer.observe(msg));

    return () => {
      observer.disconnect();
    };
  }, [chat?.messages, markMessageAsRead]);

  useEffect(() => {
    if (isError && error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat';
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      
      if (errorMessage.includes('Access denied') || errorMessage.includes('not found')) {
        setTimeout(() => navigate('/chats'), 2000);
      }
    }
  }, [isError, error, toast, navigate]);

  const otherParticipant = chat?.participants.find(p => p.id !== user?.id);

  const handleSendMessage = (content: string, type: 'text' | 'voice' = 'text', replyToId?: string) => {
    if (!id) return;
    
    sendMessage(
      { 
        chatId: id, 
        content, 
        type,
        replyTo: replyToId 
      }, 
      {
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
          });
        }
      }
    );
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (isAddingReaction) return;
    addReaction({ messageId, emoji });
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    if (isRemovingReaction) return;
    removeReaction({ messageId, emoji });
  };

  const handleReply = (messageId: string) => {
    const message = chat?.messages.find(m => m.id === messageId);
    if (message) {
      setReplyTo(message);
    }
  };

  const handleForward = (messageId: string) => {
    const message = chat?.messages.find(m => m.id === messageId);
    if (message) {
      setForwardMessage(message);
      setShowForwardDialog(true);
    }
  };

  const handleForwardToChat = async (targetChatId: string) => {
    if (!forwardMessage) return;
    
    sendMessage(
      {
        chatId: targetChatId,
        content: forwardMessage.content,
        type: forwardMessage.type || 'text',
      },
      {
        onSuccess: () => {
          setShowForwardDialog(false);
          setForwardMessage(null);
          toast({
            title: "Message forwarded",
            description: "Message has been forwarded successfully",
          });
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to forward message';
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
          });
        }
      }
    );
  };

  const formatMessageTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'p');
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

  if (isError || !chat) {
    const errorMessage = error instanceof Error ? error.message : 'Conversation not found';
    return (
      <div className="wispa-container flex flex-col items-center justify-center space-y-4">
        <p className="text-red-600">{errorMessage}</p>
        <Link 
          to="/chats" 
          className="text-wispa-500 hover:text-wispa-600"
        >
          Return to chats
        </Link>
      </div>
    );
  }

  const otherTypingUsers = typingUsers.filter(id => id !== user?.id);

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <div className="flex items-center">
          <Link to="/chats" className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Avatar src={otherParticipant?.avatar_url || undefined} alt={otherParticipant?.username || ''} status={null} />
          <div className="ml-3">
            <h2 className="font-medium">{otherParticipant?.username}</h2>
            <p className="text-xs text-wispa-100">
              {otherTypingUsers.length > 0 ? 'Typing...' : 'Last seen recently'}
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
        {chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {chat.messages.map(message => (
              <div
                key={message.id}
                data-message-id={message.user_id !== user?.id ? message.id : undefined}
              >
                <ChatBubble
                  messageId={message.id}
                  content={message.type === 'voice' ? message.media_url || '' : message.content}
                  timestamp={formatMessageTimestamp(message.created_at)}
                  isOwnMessage={message.user_id === user?.id}
                  status={(message.status as 'sent' | 'delivered' | 'read') || 'sent'}
                  type={message.type as 'text' | 'voice'}
                  reactions={message.reactions || []}
                  currentUserId={user?.id}
                  reply_to_message={message.reply_to_message}
                  onAddReaction={handleAddReaction}
                  onRemoveReaction={handleRemoveReaction}
                  onReply={handleReply}
                  onForward={handleForward}
                />
              </div>
            ))}
            
            {otherTypingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <div className="animate-bounce">•</div>
                <div className="animate-bounce delay-100">•</div>
                <div className="animate-bounce delay-200">•</div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput
        onSendMessage={handleSendMessage}
        onStartTyping={() => setTyping(true)}
        onStopTyping={() => setTyping(false)}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={isSending}
      />
      
      {showForwardDialog && (
        <ForwardMessageDialog 
          message={forwardMessage}
          onClose={() => setShowForwardDialog(false)}
          onForward={handleForwardToChat}
        />
      )}
    </div>
  );
};

export default ChatDetail;
