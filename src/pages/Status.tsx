
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStatusUpdates } from "@/services/statusService";
import StatusStoryBar from "@/components/StatusStoryBar";
import StatusViewer from "@/components/StatusViewer";
import { Button } from "@/components/ui/button";

const StatusPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStatusId, setActiveStatusId] = useState<string | undefined>();

  // Fetch all status updates
  const { data: statuses = [], isLoading } = useStatusUpdates();

  // Own status
  const myStatus = statuses.find((s) => s.user_id === user?.id);
  const otherStatuses = statuses.filter((s) => s.user_id !== user?.id);

  // Build list for the story bar ("my status" first, then others)
  const storyBarData = [
    ...(user && profile
      ? [
          {
            id: myStatus?.id || "my-status",
            user: {
              username: profile.username || user.email || "Me",
              avatar_url: profile.avatar_url || null,
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
      // For "my status" but no story, go to add
      if (statusId === "my-status" && !myStatus) {
        navigate("/status/add");
      } else {
        setActiveStatusId(statusId);
        setViewerOpen(true);
      }
    },
    [navigate, myStatus]
  );

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
        <Button
          variant="ghost"
          onClick={() => navigate("/status/add")}
          className="flex items-center space-x-2"
        >
          <PlusCircle className="h-5 w-5 mr-1" />
          <span>Add</span>
        </Button>
      </div>

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
