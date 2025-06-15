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
    <div className="rounded-xl bg-white/90 dark:bg-card/90 shadow-lg p-3 flex flex-col mb-2 border border-muted max-w-sm mx-auto relative">
      <div className="flex items-center gap-3 mb-2">
        <Avatar 
          src={status.user?.avatar_url} 
          alt={status.user?.username || 'User'} 
          size="md"
        />
        <div>
          <p className="font-bold text-gray-900 dark:text-white">{status.user?.username || 'Anonymous User'}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(status.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-primary"
            >
              ✕
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Media preview */}
      {status.media_url && (
        <div className="aspect-video w-full rounded-xl bg-gray-100 mb-2 overflow-hidden">
          <MediaPreview
            src={status.media_url}
            type={getMediaType(status.media_url)}
            showControls={false}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Status text */}
      <div className="px-2 font-medium text-base text-gray-800 dark:text-white min-h-[2rem]">
        {status.content}
      </div>

      {/* Footer actions */}
      <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" /> {status.viewed_by.length}
        </span>
        {user && <StatusReactions statusId={status.id} reactions={status.reactions || {}} currentUserId={user.id} />}
        <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm"><Share className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StatusCard;
