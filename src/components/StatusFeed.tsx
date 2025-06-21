import React, { useState, useEffect } from "react";
import CreateStatusModal from "./CreateStatusModal";
import NavBar from "@/components/NavBar";

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
        <div className="flex-1 overflow-y-auto px-0 pb-4 bg-background dark:bg-gray-900">
          {/* TODO: Render statuses here */}
          {statuses.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-lg">No statuses yet.</div>
          )}
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
