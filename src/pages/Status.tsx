
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Upload, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStatusUpdates, useCreateStatus } from "@/services/statusService";
import StatusStoryBar from "@/components/StatusStoryBar";
import StatusViewer from "@/components/StatusViewer";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/FileUpload";
import MediaPreview from "@/components/MediaPreview";
import { uploadFile } from "@/services/fileUploadService";
import { useToast } from "@/hooks/use-toast";

const StatusPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // For status creation UI
  const [statusText, setStatusText] = useState("");
  const [statusFile, setStatusFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
              username: user.email || "Me",
              avatar_url: user.avatar_url || null,
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-gray-500">Loading statuses...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold text-wispa-500">Status</h1>
        <Button variant="ghost" onClick={() => signOut()}>
          Log out
        </Button>
      </div>

      {/* Create Status (Story) UI */}
      {user && (
        <form
          id="status-create-form"
          onSubmit={handlePostStatus}
          className="flex flex-col gap-3 px-4 py-4 border-b bg-gray-50"
        >
          <div className="flex gap-3 items-center">
            <span className="font-medium mr-2">Create new status</span>
            <FileUpload
              onFileSelect={handleFileSelect}
              bucketType="status"
              accept="image/*,video/*"
              maxSize={10 * 1024 * 1024}
              className="flex-1"
            >
              <Button type="button" variant="outline" size="sm" className="flex gap-2 items-center">
                <Upload className="h-4 w-4" />
                {statusFile ? "Change" : "Add photo/video"}
              </Button>
            </FileUpload>
            {statusFile && (
              <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {statusFile && (
            <div className="mb-2">
              <MediaPreview
                src={URL.createObjectURL(statusFile)}
                type={statusFile.type.startsWith("video") ? "video" : "image"}
                name={statusFile.name}
                showControls={false}
              />
            </div>
          )}
          <textarea
            className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-wispa-500"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            rows={2}
            placeholder="What's up?"
            maxLength={300}
            disabled={isUploading}
          />
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={isUploading || (!statusText && !statusFile)}>
              {isUploading ? "Posting..." : "Post Status"}
            </Button>
          </div>
        </form>
      )}

      {/* Story Bar */}
      <StatusStoryBar
        statuses={storyBarData}
        currentUserId={user?.id}
        onSelect={handleStoryBarSelect}
        myStatusId={myStatus?.id}
      />

      {/* List of all statuses with time/info */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <h2 className="text-sm text-gray-400 mb-4">Recent Updates</h2>
        <div className="space-y-6">
          {otherStatuses.length === 0 && (
            <div className="text-gray-500 text-center">No recent updates</div>
          )}
          {otherStatuses.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStoryBarSelect(s.id)}
              className="flex items-center gap-3 py-2 px-2 w-full rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <img
                src={s.user?.avatar_url || "/default-avatar.png"}
                alt={s.user?.username || "User"}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800 dark:text-gray-50">
                  {s.user?.username || "User"}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(s.created_at).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Status Viewer Modal */}
      {activeStatusId && (
        <StatusViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          initialStatusId={activeStatusId}
          statuses={statuses}
        />
      )}
    </div>
  );
};

export default StatusPage;
