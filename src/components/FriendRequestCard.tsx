
import React from 'react';
import { Check, X } from 'lucide-react';
import Avatar from './Avatar';
import { Button } from '@/components/ui/button';
import { FriendRequest } from '@/services/friendService';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isOutgoing?: boolean;
}

const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  request,
  onAccept,
  onReject,
  isOutgoing = false
}) => {
  const profile = isOutgoing ? request.recipient : request.sender;
  
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Avatar 
            src={profile?.avatar_url || undefined} 
            alt={profile?.username || 'User'} 
            status={null}
          />
          <div className="ml-3">
            <h3 className="font-medium">{profile?.username}</h3>
            <p className="text-xs text-gray-500">ID: {profile?.user_id}</p>
          </div>
        </div>
        
        {isOutgoing ? (
          <div className="text-sm text-gray-500">
            Request sent
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button 
              size="sm"
              onClick={() => onAccept(request.id)}
              className="bg-wispa-500 hover:bg-wispa-600"
            >
              <Check className="h-4 w-4 mr-1" /> Accept
            </Button>
            <Button 
              size="sm"
              variant="outline" 
              onClick={() => onReject(request.id)}
            >
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequestCard;
