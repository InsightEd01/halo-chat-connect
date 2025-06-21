import React, { useState, useEffect } from "react";
import CreateStatusModal from "./CreateStatusModal";
import NavBar from "@/components/NavBar";
import StatusStoryBar from "./StatusStoryBar";
import Avatar from "@/components/Avatar";

const StatusPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'friends' | 'public'>('friends');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statuses, setStatuses] = useState([]);
  // TODO: Get user from context or props
  const user = { id: "demo-user" };

  useEffect(() => {
    // TODO: Fetch statuses from Supabase
    setStatuses([]);
  }, [viewMode, user.id]);

  return (
    <div className="container max-w-md mx-auto p-0 pb-20 bg-white">
      <div className="flex flex-col h-screen bg-background dark:bg-gray-900">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-10 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Status</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="wispa-btn wispa-btn-primary rounded-full shadow"
            >
              Create Status
            </button>
          </div>
        </header>
        <div className="flex border-b border-border sticky top-[64px] z-10 bg-white dark:bg-gray-900">
          <button
            className={`flex-1 py-2 font-semibold rounded-t transition-colors duration-150 ${viewMode === 'friends' ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
            onClick={() => setViewMode('friends')}
          >
            Friends Posts
          </button>
          <button
            className={`flex-1 py-2 font-semibold rounded-t transition-colors duration-150 ${viewMode === 'public' ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
            onClick={() => setViewMode('public')}
          >
            Public Posts
          </button>
        </div>
        {/* Facebook-like Story Bar */}
        <div className="sticky top-[112px] z-10 bg-background dark:bg-gray-900 px-4 py-2 border-b border-border">
          <StatusStoryBar />
        </div>
        <div className="flex-1 overflow-y-auto px-0 pb-4 bg-background dark:bg-gray-900">
          {/* Modern Facebook-like Feed */}
          <div className="flex flex-col gap-4 px-2 pt-2">
            {statuses.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-lg">No statuses yet.</div>
            ) : (
              statuses.map((status, idx) => (
                <div key={status.id || idx} className="bg-white dark:bg-gray-900 border border-border rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-1">
                    <Avatar src={status.user?.avatar_url} alt={status.user?.username || 'User'} size="sm" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm">{status.user?.username || 'Anonymous'}</span>
                      <span className="text-xs text-muted-foreground">{status.created_at ? new Date(status.created_at).toLocaleString() : ''}</span>
                    </div>
                  </div>
                  {status.caption && <div className="text-base text-foreground mb-1">{status.caption}</div>}
                  {status.content_url && status.content_type === 'image' && (
                    <img src={status.content_url} alt="status" className="rounded-lg max-h-72 w-full object-cover border" />
                  )}
                  {status.content_url && status.content_type === 'video' && (
                    <video src={status.content_url} controls className="rounded-lg max-h-72 w-full object-cover border" />
                  )}
                  {status.content_url && status.content_type === 'audio' && (
                    <audio src={status.content_url} controls className="w-full my-2" />
                  )}
                  <div className="flex items-center gap-6 mt-2 text-xs text-muted-foreground">
                    <span>👁️ {status.status_views?.length || 0}</span>
                    <span>👍 {status.status_reactions?.length || 0}</span>
                    <span>💬 {status.status_comments?.length || 0}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="wispa-btn wispa-btn-secondary text-xs">Like</button>
                    <button className="wispa-btn wispa-btn-secondary text-xs">Comment</button>
                    <button className="wispa-btn wispa-btn-secondary text-xs">Share</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {showCreateModal && (
          <CreateStatusModal
            user={user}
            onClose={() => setShowCreateModal(false)}
            onPost={() => {}}
          />
        )}
      </div>
      <NavBar />
    </div>
  );
};

export default StatusPage;
