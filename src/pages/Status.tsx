import React, { useState, useEffect } from 'react';
import { Plus, Camera, Trash2, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import NavBar from '@/components/NavBar';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { StatusUpdate } from '@/services/statusService';

interface StatusUpdate {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  created_at: string;
  expires_at: string;
  viewed_by: string[];
  user?: {
    username: string;
    avatar_url: string | null;
  };
}

const Status: React.FC = () => {
  const { user } = useAuth();
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [myStatus, setMyStatus] = useState<StatusUpdate | null>(null);
  const [otherStatuses, setOtherStatuses] = useState<StatusUpdate[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusContent, setStatusContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showStatusForm, setShowStatusForm] = useState(false);

  // Fetch all status updates
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('status_updates')
          .select('*, user:profiles!status_updates_user_id_fkey(username, avatar_url)')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Process data to ensure viewed_by is always a string array
          const processedData = data.map(status => {
            let viewedBy: string[] = [];
            
            // Handle different possible types of viewed_by
            if (status.viewed_by === null) {
              viewedBy = [];
            } else if (Array.isArray(status.viewed_by)) {
              viewedBy = status.viewed_by.map(id => String(id));
            } else if (typeof status.viewed_by === 'object') {
              viewedBy = Object.values(status.viewed_by).map(id => String(id));
            }
            
            return {
              ...status,
              viewed_by: viewedBy
            } as StatusUpdate;
          });
          
          const myStatusData = processedData.find(status => status.user_id === user.id) || null;
          const otherStatusesData = processedData.filter(status => status.user_id !== user.id);
          
          setMyStatus(myStatusData);
          setOtherStatuses(otherStatusesData);
          setStatusUpdates(processedData);
        }
      } catch (error: any) {
        console.error('Error fetching statuses:', error.message);
        toast({
          title: 'Error',
          description: 'Failed to load status updates',
          variant: 'destructive',
        });
      }
    };
    
    fetchStatuses();
    
    // Set up real-time subscription to status_updates table
    const statusChannel = supabase
      .channel('status_changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'status_updates'
        }, 
        (payload) => {
          console.log('Status update change received:', payload);
          fetchStatuses();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }
    
    setImageFile(file);
  };

  const createStatus = async () => {
    if (!user) return;
    
    if (!statusContent && !imageFile) {
      toast({
        title: 'No content',
        description: 'Please add some text or an image to your status',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      let mediaUrl = null;
      
      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('status')
          .upload(filePath, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('status')
          .getPublicUrl(filePath);
          
        mediaUrl = data.publicUrl;
      }
      
      // Insert status update
      const { error: insertError } = await supabase
        .from('status_updates')
        .insert({
          user_id: user.id,
          content: statusContent || null,
          media_url: mediaUrl,
        });
        
      if (insertError) throw insertError;
      
      toast({
        title: 'Status updated',
        description: 'Your status has been updated successfully',
      });
      
      setStatusContent('');
      setImageFile(null);
      setShowStatusForm(false);
    } catch (error: any) {
      console.error('Error creating status:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteStatus = async (statusId: string) => {
    try {
      // If status has media, delete it from storage
      const statusToDelete = statusUpdates.find(s => s.id === statusId);
      
      if (statusToDelete?.media_url) {
        const mediaPath = statusToDelete.media_url.split('/').slice(-2).join('/');
        await supabase.storage.from('status').remove([mediaPath]);
      }
      
      // Delete status from database
      const { error } = await supabase
        .from('status_updates')
        .delete()
        .eq('id', statusId);
        
      if (error) throw error;
      
      toast({
        title: 'Status deleted',
        description: 'Your status has been deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting status:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to delete status',
        variant: 'destructive',
      });
    }
  };

  const viewStatus = async (statusId: string) => {
    if (!user) return;
    
    try {
      // Record view
      const { error } = await supabase
        .from('status_views')
        .insert({
          status_id: statusId,
          viewer_id: user.id
        })
        .select()
        .single();
      
      // We're ok with error if it's a uniqueness violation (already viewed)
      if (error && !error.message.includes('unique constraint')) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error recording status view:', error.message);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      // If it's less than 24 hours ago, show relative time
      const now = new Date();
      const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      
      // Otherwise show the date
      return format(date, 'MMM d, h:mm a');
    } catch (e) {
      return 'Unknown time';
    }
  };

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <h1 className="text-2xl font-bold">Status</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        {/* My Status section */}
        <div className="px-4 py-3 border-b">
          <h3 className="text-gray-500 text-sm mb-3">My Status</h3>
          
          {!showStatusForm ? (
            <div className="flex items-center">
              <div className="relative">
                <Avatar
                  src={user?.user_metadata?.avatar_url}
                  size="lg"
                  className={myStatus ? "border-2 border-wispa-500" : ""}
                />
                <button 
                  className="absolute bottom-0 right-0 bg-wispa-500 text-white p-1.5 rounded-full"
                  onClick={() => setShowStatusForm(true)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="ml-3">
                <h3 className="font-medium">My Status</h3>
                <p className="text-sm text-gray-500">
                  {myStatus 
                    ? `Last updated ${formatTimestamp(myStatus.created_at)}`
                    : "Tap to add status update"}
                </p>
              </div>
              
              {myStatus && (
                <button 
                  onClick={() => deleteStatus(myStatus.id)} 
                  className="ml-auto text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <textarea
                value={statusContent}
                onChange={(e) => setStatusContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-2 border rounded mb-3 h-24 resize-none"
              />
              
              {imageFile && (
                <div className="relative w-full mb-3">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Status preview"
                    className="w-full h-40 object-cover rounded"
                  />
                  <button
                    onClick={() => setImageFile(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <label className="flex items-center text-wispa-500 font-medium cursor-pointer">
                  <Camera className="h-5 w-5 mr-1" />
                  Add Photo
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
                
                <div className="space-x-2">
                  <button
                    onClick={() => setShowStatusForm(false)}
                    className="px-3 py-1.5 rounded border"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createStatus}
                    className="px-3 py-1.5 bg-wispa-500 text-white rounded"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Recent updates */}
        {otherStatuses.length > 0 ? (
          <div>
            <h3 className="text-gray-500 text-sm px-4 py-3">Recent Updates</h3>
            {otherStatuses.map(status => (
              <div 
                key={status.id}
                className="px-4 py-3 border-b flex items-center hover:bg-gray-50"
                onClick={() => viewStatus(status.id)}
              >
                <Avatar 
                  src={status.user?.avatar_url || undefined} 
                  alt={status.user?.username || 'User'} 
                  className={`border-2 ${status.viewed_by?.includes(user?.id || '') ? 'border-gray-300' : 'border-wispa-500'}`}
                />
                <div className="ml-3">
                  <h3 className="font-medium">{status.user?.username || 'User'}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>{formatTimestamp(status.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No status updates"
            description="When your contacts add status updates, you'll see them here"
          />
        )}
      </div>
      
      <NavBar />
    </div>
  );
};

export default Status;
