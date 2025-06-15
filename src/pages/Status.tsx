
import React, { useState } from 'react';
import { Plus, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import StatusCard from '@/components/StatusCard';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import { useCreateStatus, useStatusUpdates } from '@/services/statusService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile } from '@/services/fileUploadService';
import StatusStoryBar from '@/components/StatusStoryBar';
import StatusViewer from '@/components/StatusViewer';
import { Skeleton } from '@/components/ui/skeleton';
import Avatar from '@/components/Avatar';

const Status: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: statusUpdates = [], isLoading } = useStatusUpdates();
  const { mutate: createStatus, isPending } = useCreateStatus();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStatusId, setActiveStatusId] = useState<string|undefined>();

  const handleCreateStatus = async () => {
    if (!content.trim() && !selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add some content or select a file",
      });
      return;
    }

    let mediaUrl: string | undefined;

    if (selectedFile) {
      if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to post a status." });
        return;
      }
      try {
        const uploadedFile = await uploadFile({
          bucket: 'status',
          file: selectedFile,
          userId: user.id,
        });
        mediaUrl = uploadedFile.url;
      } catch (error) {
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload media. Please try again." });
        return;
      }
    }

    createStatus(
      { 
        content: content.trim() || undefined, 
        mediaUrl: mediaUrl
      },
      {
        onSuccess: () => {
          setContent('');
          setSelectedFile(null);
          setIsCreating(false);
          toast({
            title: "Status created",
            description: "Your status has been posted successfully",
          });
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create status';
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
          });
        }
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Prepare story bar data: current user + friends, show own first
  const ownStatus = statusUpdates?.find((s) => s.user_id === user?.id);
  const otherStatuses = statusUpdates?.filter((s) => s.user_id !== user?.id) || [];
  const storyStatuses = [
    ...(ownStatus
      ? [{ id: ownStatus.id, user: ownStatus.user || { username: user?.email?.split('@')[0] || 'Me', avatar_url: user?.avatar_url }, isOwn: true }]
      : [{
        id: 'my-status-placeholder',
        user: { username: user?.email?.split('@')[0] || 'Me', avatar_url: user?.avatar_url },
        isOwn: true
      }]
    ),
    ...otherStatuses.map((s) => ({
      id: s.id,
      user: s.user,
      isOwn: false
    }))
  ];

  const handleStatusBarSelect = (storyId: string) => {
    if (storyId === 'my-status-placeholder') {
      setIsCreating(true);
      return;
    }
    setActiveStatusId(storyId);
    setViewerOpen(true);
  };

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <h1 className="text-2xl font-bold tracking-tighter">WispaChat</h1>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-wispa-500 hover:bg-wispa-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
              
              <div className="flex items-center space-x-2">
                <label htmlFor="media-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                    <Camera className="h-4 w-4" />
                    <span className="text-sm">Add Photo/Video</span>
                  </div>
                  <input
                    id="media-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                
                {selectedFile && (
                  <span className="text-sm text-gray-500">
                    {selectedFile.name}
                  </span>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateStatus}
                  disabled={isPending || (!content.trim() && !selectedFile)}
                  className="bg-wispa-500 hover:bg-wispa-600"
                >
                  {isPending ? 'Posting...' : 'Post Status'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>
      <StatusStoryBar
        statuses={storyStatuses}
        currentUserId={user?.id}
        myStatusId={ownStatus?.id}
        onSelect={handleStatusBarSelect}
      />
      <div className="flex-1 overflow-y-auto wispa-content-with-navbar p-4 bg-wispa-50 dark:bg-gray-950 min-h-[0]">
        {isLoading ? (
          <div className="space-y-4 mt-2">
            {[...Array(5)].map((_, i) => (
              <div className="flex items-center space-x-3" key={i}>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
            ))}
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">You must be logged in to view statuses.</p>
          </div>
        ) : !statusUpdates ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">Error loading statuses.</p>
          </div>
        ) : statusUpdates.length > 0 ? (
          <div className="space-y-6 mt-6">
            {otherStatuses.length === 0 && (
              <EmptyState
                title="No friends' status updates"
                description="Ask your friends to post a status!"
              />
            )}
            {otherStatuses.map(status => (
              <div
                key={status.id}
                className="hover:bg-wispa-100 rounded-xl p-2 mb-2 transition cursor-pointer"
                onClick={() => { setActiveStatusId(status.id); setViewerOpen(true); }}
              >
                <div className="flex items-center space-x-3">
                  <Avatar src={status.user?.avatar_url ?? undefined} alt={status.user?.username} size="md" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{status.user?.username}</div>
                    <div className="text-xs text-gray-500">{status.content?.slice(0, 32) || "Media update"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <EmptyState
              title="No status updates"
              description="Be the first to share what's on your mind"
            />
            <div className="mt-4 text-xs text-gray-400 text-center">
              {/* Debug info for development */}
              <p>
                No statuses matched query.<br />
                Make sure your time, timezone, and session is correct.
              </p>
            </div>
          </div>
        )}
      </div>
      <NavBar />
      <StatusViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        initialStatusId={activeStatusId}
        statuses={statusUpdates}
      />
    </div>
  );
};

export default Status;
