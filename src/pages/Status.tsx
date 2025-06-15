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

const Status: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: statusUpdates = [], isLoading } = useStatusUpdates();
  const { mutate: createStatus, isPending } = useCreateStatus();

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

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <h1 className="text-2xl font-bold">Status</h1>
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
      
      <div className="flex-1 overflow-y-auto wispa-content-with-navbar p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Loading status updates...</p>
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
          <div className="space-y-4">
            {statusUpdates.map(status => (
              <StatusCard key={status.id} status={status} />
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
                No statuses matched query.
                <br />
                Make sure your time, timezone, and session is correct.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <NavBar />
    </div>
  );
};

export default Status;
