
import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStatusUpdates, useCreateStatus } from '@/services/statusService';
import { useAuth } from '@/contexts/AuthContext';
import StatusViewer from '@/components/StatusViewer';
import FileUpload from '@/components/FileUpload';
import MediaPreview from '@/components/MediaPreview';
import Avatar from '@/components/Avatar';
import NavBar from '@/components/NavBar';
import { uploadFile } from '@/services/fileUploadService';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

const Status: React.FC = () => {
  const { user } = useAuth();
  const { data: statuses, isLoading } = useStatusUpdates();
  const createStatusMutation = useCreateStatus();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusContent, setStatusContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleCreateStatus = async () => {
    if (!user || (!statusContent.trim() && !selectedFile)) return;

    setIsUploading(true);
    try {
      let mediaFile = selectedFile;

      await createStatusMutation.mutateAsync({
        content: statusContent.trim() || undefined,
        mediaFile
      });

      setStatusContent('');
      setSelectedFile(null);
      setFilePreview(null);
      setShowCreateForm(false);
      
      toast({
        title: 'Success',
        description: 'Status created successfully',
      });
    } catch (error) {
      console.error('Error creating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to create status',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getMediaType = (url: string): 'image' | 'video' | 'audio' | 'document' => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['mp4', 'webm', 'mov'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) return 'audio';
    return 'document';
  };

  if (isLoading) {
    return (
      <div className="wispa-container flex items-center justify-center">
        <p>Loading statuses...</p>
      </div>
    );
  }

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Status</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Create Status Form */}
        {showCreateForm && (
          <div className="p-4 border-b bg-gray-50">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar 
                  src={user?.user_metadata?.avatar_url} 
                  alt={user?.email || 'You'} 
                  size="sm"
                />
                <div className="flex-1">
                  <Input
                    placeholder="What's on your mind?"
                    value={statusContent}
                    onChange={(e) => setStatusContent(e.target.value)}
                    className="border-none bg-transparent text-base resize-none"
                  />
                </div>
              </div>

              {filePreview && selectedFile && (
                <MediaPreview
                  src={filePreview}
                  type={getMediaType(selectedFile.name)}
                  name={selectedFile.name}
                  onRemove={handleRemoveFile}
                  className="max-h-64"
                />
              )}

              <div className="flex items-center justify-between">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  bucketType="status"
                  maxSize={10 * 1024 * 1024} // 10MB
                  accept="image/*,video/*"
                  className="flex-1 mr-4"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Add Media
                  </Button>
                </FileUpload>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateStatus}
                    disabled={(!statusContent.trim() && !selectedFile) || isUploading}
                    className="bg-wispa-500 hover:bg-wispa-600"
                  >
                    {isUploading ? 'Posting...' : 'Post Status'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status List */}
        <div className="p-4 space-y-4">
          {statuses && statuses.length > 0 ? (
            statuses.map((status) => (
              <div
                key={status.id}
                className="bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedStatusId(status.id)}
              >
                <div className="flex items-start gap-3">
                  <Avatar 
                    src={status.user?.avatar_url} 
                    alt={status.user?.username || 'User'} 
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {status.user?.username || 'Anonymous User'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(status.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {status.content && (
                      <p className="text-gray-800 mb-3">{status.content}</p>
                    )}

                    {status.media_url && (
                      <MediaPreview
                        src={status.media_url}
                        type={getMediaType(status.media_url)}
                        showControls={false}
                        className="max-h-64 mb-3"
                      />
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{status.viewed_by.length} views</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No status updates yet</p>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                className="mt-4"
              >
                Create your first status
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Status Viewer */}
      {selectedStatusId && (
        <StatusViewer
          isOpen={!!selectedStatusId}
          onClose={() => setSelectedStatusId(null)}
          initialStatusId={selectedStatusId}
          statuses={statuses}
        />
      )}

      <NavBar />
    </div>
  );
};

export default Status;
