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
import Avatar from '@/components/Avatar';

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
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile header: recent status */}
      <header className="bg-white dark:bg-card/30 px-4 pt-4 pb-0 flex items-center gap-4 border-b shadow-sm">
        <Avatar src={user?.avatar_url} alt={user?.username} size="lg" className="border-2 border-primary" status="online" />
        <div>
          <div className="text-xs text-muted-foreground">Your Status</div>
          <div className="font-bold">{user?.username || 'You'}</div>
        </div>
        <div className="ml-auto">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-br from-orange-500 to-yellow-400 text-white rounded-full shadow font-bold"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
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
        </div>
      </header>
      
      {/* Tabs Row */}
      <div className="sticky top-0 flex border-b bg-white dark:bg-card/30 w-full z-10">
        <button 
          className="flex-1 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => window.location.pathname = '/chats'}
        >Chats</button>
        <button 
          className="flex-1 py-3 text-center font-medium transition-colors text-primary border-b-2 border-primary"
        >Status</button>
        <button 
          className="flex-1 py-3 text-center font-medium transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => window.location.pathname = '/calls'}
        >Calls</button>
      </div>

      <main className="flex-1 overflow-y-auto px-2 pb-24 bg-muted">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Loading...</p>
          </div>
        ) : statusUpdates.length > 0 ? (
          <div className="space-y-4 mt-3">
            {statusUpdates.map(status => (
              <StatusCard key={status.id} status={status} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No status updates"
            description="Be the first to share what's on your mind"
          />
        )}
      </main>

      <NavBar />
    </div>
  );
};

export default Status;
