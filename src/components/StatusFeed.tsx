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
      <div className="flex flex-col h-screen bg-white">
        <header className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">Status</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#ff6200] hover:bg-[#ff7f32] text-white px-4 py-2 rounded-full shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#ff6200]"
            >
              Create Status
            </button>
          </div>
        </header>
        <div className="flex border-b sticky top-[64px] z-10 bg-white">
          <button
            className={`flex-1 py-2 font-semibold rounded-t transition-colors duration-150 ${viewMode === 'friends' ? 'bg-[#ff6200] text-white shadow' : 'bg-[#ffe6e6] text-[#ff6200] hover:bg-[#ffd6b3]'}`}
            onClick={() => setViewMode('friends')}
          >
            Friends Posts
          </button>
          <button
            className={`flex-1 py-2 font-semibold rounded-t transition-colors duration-150 ${viewMode === 'public' ? 'bg-[#ff6200] text-white shadow' : 'bg-[#ffe6e6] text-[#ff6200] hover:bg-[#ffd6b3]'}`}
            onClick={() => setViewMode('public')}
          >
            Public Posts
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-0 pb-4 bg-white">
          {/* TODO: Render statuses here */}
          {statuses.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400 text-lg">No statuses yet.</div>
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
