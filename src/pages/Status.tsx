import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Upload, X, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStatusUpdates, useCreateStatus } from "@/services/statusService";
import StatusStoryBar from "@/components/StatusStoryBar";
import StatusViewer from "@/components/StatusViewer";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/FileUpload";
import MediaPreview from "@/components/MediaPreview";
import { uploadFile } from "@/services/fileUploadService";
import { useToast } from "@/hooks/use-toast";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import NavBar from "@/components/NavBar";

const StatusPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For status creation UI
  const [statusText, setStatusText] = useState("");
  const [statusFile, setStatusFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const createStatus = useCreateStatus();

  // For status viewing
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStatusId, setActiveStatusId] = useState<string | undefined>();

  // Fetch all status updates
  const { data: statuses = [], isLoading } = useStatusUpdates();

  // Own status: use user_id to find
  const myStatus = user ? statuses.find((s) => s.user_id === user.id) : undefined;
  const otherStatuses = user ? statuses.filter((s) => s.user_id !== user.id) : statuses;

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
  const handleFileSelect = (file: File) => {
    setStatusFile(file);
  };

  // Remove picked file
  const handleRemoveFile = () => {
    setStatusFile(null);
  };

  // Submit status (Post)
  const handlePostStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!statusText || statusText.trim() === "") && !statusFile) {
      toast({ title: "Add something!", description: "Please enter text or pick a file", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    let mediaUrl: string | undefined;
    try {
      if (statusFile) {
        // Upload file to 'status' bucket
        const res = await uploadFile({ bucket: "status", file: statusFile, userId: user!.id });
        mediaUrl = res.url;
      }
      await createStatus.mutateAsync({ content: statusText, mediaUrl });
      setStatusText("");
      setStatusFile(null);
      toast({ title: "Status posted!", description: "Your story is now visible to contacts." });
    } catch (err: any) {
      toast({ title: "Failed to post status", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setStatusFile(file);
  }, []);

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*;capture=camera";
      fileInputRef.current.click();
    }
  };

  const handleSubmitStatus = async () => {
    if (!statusFile && !statusText) {
      toast({
        title: "Error",
        description: "Please add a photo, video, or text for your status",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = "";
      if (statusFile) {
        fileUrl = await uploadFile(statusFile, "status");
      }

      await createStatus.mutateAsync({
        text: statusText,
        media_url: fileUrl,
        type: statusFile ? (statusFile.type.startsWith('video') ? 'video' : 'image') : 'text'
      });

      setStatusText("");
      setStatusFile(null);
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const { isOnline } = useNetworkStatus();

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
    <div className="container max-w-3xl mx-auto p-4 pb-20">
      <NavBar />
      {/* Status Creation Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col space-y-4">
          <div className="flex space-x-2">
            <FileUpload
              onFileSelect={handleFileUpload}
              accept="image/*,video/*"
              maxSize={20 * 1024 * 1024} // 20MB
              bucketType="status"
            >
              <Button variant="ghost" size="icon">
                <Upload className="h-5 w-5" />
              </Button>
            </FileUpload>

            <Button variant="ghost" size="icon" onClick={handleCameraCapture}>
              <Camera className="h-5 w-5" />
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              accept="image/*;capture=camera"
            />
          </div>

          {statusFile && (
            <div className="relative">
              <MediaPreview file={statusFile} />
              <button
                onClick={() => setStatusFile(null)}
                className="absolute top-2 right-2 p-1 bg-gray-900/50 rounded-full"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          )}

          <textarea
            placeholder="What's on your mind?"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            rows={3}
          />

          <Button
            onClick={handleSubmitStatus}
            disabled={isUploading || (!statusFile && !statusText)}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Post Status"}
          </Button>
        </div>
      </div>

      {/* Status List Section */}
      <div className="space-y-4">
        <StatusStoryBar
          stories={storyBarData}
          onStoryClick={(storyId) => {
            setActiveStatusId(storyId);
            setViewerOpen(true);
          }}
        />
      </div>

      {/* Status Viewer */}
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
