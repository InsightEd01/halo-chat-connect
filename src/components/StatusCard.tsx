
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Eye, MessageCircle, Share, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewStatus } from '@/services/statusService';
import { useAuth } from '@/contexts/AuthContext';
import { StatusUpdate } from '@/types/status';
import MediaPreview from './MediaPreview';
import Avatar from './Avatar';
import StatusReactions from './StatusReactions';

interface StatusCardProps {
  status: StatusUpdate;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({
  status,
  onClose,
  onNext,
  onPrevious,
  showNavigation = false
}) => {
  const { user } = useAuth();
  const [hasViewed, setHasViewed] = useState(false);
  const viewStatusMutation = useViewStatus();

  React.useEffect(() => {
    if (!hasViewed && user) {
      viewStatusMutation.mutate({ statusId: status.id });
      setHasViewed(true);
    }
  }, [status.id, hasViewed, user]);

  const getMediaType = (url: string): 'image' | 'video' | 'audio' | 'document' => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['mp4', 'webm', 'mov'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) return 'audio';
    return 'document';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar 
              src={status.user?.avatar_url} 
              alt={status.user?.username || 'User'} 
              size="sm"
            />
            <div>
              <p className="text-white font-medium">
                {status.user?.username || 'Anonymous User'}
              </p>
              <p className="text-white/70 text-sm">
                {formatDistanceToNow(new Date(status.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center h-full">
        {status.media_url ? (
          <MediaPreview
            src={status.media_url}
            type={getMediaType(status.media_url)}
            showControls={false}
            className="max-w-full max-h-full"
          />
        ) : (
          <div className="flex items-center justify-center p-8">
            <p className="text-white text-xl text-center max-w-md">
              {status.content}
            </p>
          </div>
        )}
      </div>

      {/* Text overlay for media with text */}
      {status.media_url && status.content && (
        <div className="absolute bottom-32 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-center">
            {status.content}
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center text-sm text-gray-200 gap-1">
            <Eye className="h-4 w-4" />
            <span>{status.viewCount}</span>
          </div>
          
          {user && (
            <StatusReactions
              statusId={status.id}
              reactions={status.reactions || {}}
              currentUserId={user.id}
            />
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {showNavigation && (
        <>
          {onPrevious && (
            <Button
              variant="ghost"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
              onClick={onPrevious}
            >
              ←
            </Button>
          )}
          {onNext && (
            <Button
              variant="ghost"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
              onClick={onNext}
            >
              →
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default StatusCard;
