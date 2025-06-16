import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image, MoreVertical, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStatusUpdates, useCreateStatus } from "@/services/statusService";
import StatusViewer from "@/components/StatusViewer";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/Avatar";
import { uploadFile } from "@/services/fileUploadService";
import { useToast } from "@/hooks/use-toast";
import NavBar from "@/components/NavBar";
import { cn } from "@/lib/utils";

const StatusPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createStatus = useCreateStatus();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStatusId, setActiveStatusId] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  // For status viewing
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStatusId, setActiveStatusId] = useState<string | undefined>();

  // Fetch all status updates
  const { data: statuses = [], isLoading } = useStatusUpdates();

  // Own status: use user_id to find
  const myStatuses = user ? statuses.filter((s) => s.user_id === user.id) : [];
  const recentStatuses = user ? statuses.filter((s) => s.user_id !== user.id && !s.viewed) : [];
  const viewedStatuses = user ? statuses.filter((s) => s.user_id !== user.id && s.viewed) : [];

  // Build list for the story bar ("my status" first, then others)
  const storyBarData = [
    ...(user
      ? [
          {
            id: myStatus?.id || "my-status",
            user: {
              username:
                user.user_metadata?.username ||
                user.email ||
                "Me",
              avatar_url: user.user_metadata?.avatar_url || null,
            },
            isOwn: true,
          },
        ]
      : []),
    ...otherStatuses.map((s) => ({
      id: s.id,
      user: {
        username: s.user?.username || "User",
        avatar_url: s.user?.avatar_url || null,
      },
      isOwn: false,
    })),
  ];

  // Open viewer (modal)
  const handleStoryBarSelect = useCallback(
    (statusId: string) => {
      // For "my status" but no story, go to add (scrolls to create form)
      if (statusId === "my-status" && !myStatus) {
        document.getElementById("status-create-form")?.scrollIntoView({ behavior: "smooth" });
      } else {
        setActiveStatusId(statusId);
        setViewerOpen(true);
      }
    },
    [myStatus]
  );

  // Handle file picking
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const mediaUrl = await uploadFile(file, "status");
      await createStatus.mutateAsync({
        media_url: mediaUrl,
        type: file.type.startsWith('video') ? 'video' : 'image'
      });
      
      toast({
        title: "Status updated",
        description: "Your status has been posted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*;capture=camera";
      fileInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*,video/*";
      fileInputRef.current.click();
    }
  };

  const openStatus = (statusId: string) => {
    setActiveStatusId(statusId);
    setViewerOpen(true);
  };

  const renderStatusItem = (status: any, showViewedLabel = false) => (
    <div
      key={status.id}
      onClick={() => openStatus(status.id)}
      className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
    >
      <div className="relative">
        <div className={cn(
          "p-[2px] rounded-full",
          status.viewed
            ? "bg-gray-200 dark:bg-gray-700"
            : "bg-gradient-to-tr from-blue-500 to-green-500"
        )}>
          <Avatar
            user={status.user}
            size="lg"
            className="w-12 h-12"
          />
        </div>
      </div>
      <div className="ml-3 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold">
              {status.user_id === user?.id ? "My Status" : status.user?.username || "User"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(status.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-destructive">You are offline. Please check your connection.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-gray-500">Loading statuses...</span>
      </div>
    );
  }

  if (createStatus.isError || !statuses) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-destructive">Failed to load statuses or post status. Please try again later.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <NavBar />
      <div className="flex-1 overflow-y-auto pb-20">
        {/* My Status Section */}
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Avatar
                user={user}
                size="lg"
                className="w-12 h-12"
              />
              <button
                onClick={handleCameraClick}
                className="absolute -right-1 -bottom-1 bg-blue-500 rounded-full p-1"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1" onClick={() => myStatuses.length > 0 && openStatus(myStatuses[0].id)}>
              <h3 className="text-sm font-semibold">My Status</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {myStatuses.length > 0 ? "Tap to view status" : "Tap to add status update"}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGalleryClick}
                disabled={isUploading}
              >
                <Image className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        {recentStatuses.length > 0 && (
          <div>
            <div className="px-4 py-2">
              <h2 className="text-sm font-semibold text-blue-500">Recent Updates</h2>
            </div>
            {recentStatuses.map(status => renderStatusItem(status))}
          </div>
        )}

        {/* Viewed Updates */}
        {viewedStatuses.length > 0 && (
          <div>
            <div className="px-4 py-2">
              <h2 className="text-sm font-semibold text-gray-500">Viewed Updates</h2>
            </div>
            {viewedStatuses.map(status => renderStatusItem(status, true))}
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,video/*"
      />

      <StatusViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        initialStatusId={activeStatusId}
        statuses={statuses}
      />
    </div>
  );
};

export default StatusPage;
