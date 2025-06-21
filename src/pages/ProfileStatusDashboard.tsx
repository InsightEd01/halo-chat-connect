import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ProfileStatusDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myStatuses, setMyStatuses] = useState([]);

  useEffect(() => {
    const fetchMyStatuses = async () => {
      const { data, error } = await supabase
        .from('statuses')
        .select(`*, status_views(count), status_reactions(reaction_type), status_comments(comment)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) setMyStatuses(data);
    };
    fetchMyStatuses();
  }, [user.id]);

  return (
    <div className="flex flex-col p-4 bg-white min-h-screen">
      <h2 className="text-xl font-bold mb-4">My Statuses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {myStatuses.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center h-32 text-gray-400 text-lg">No statuses yet.</div>
        ) : myStatuses.map((status) => (
          <div key={status.id} className="border rounded-lg p-2 bg-[#ffe6e6] shadow hover:shadow-lg transition flex flex-col">
            {status.content_type === 'image' && (
              <img src={status.content_url} alt="Status" className="w-full h-32 object-cover rounded mb-2" />
            )}
            {status.content_type === 'video' && (
              <video className="w-full h-32 object-cover rounded mb-2" controls>
                <source src={status.content_url} type="video/mp4" />
              </video>
            )}
            {status.content_type === 'audio' && (
              <audio controls className="w-full mb-2">
                <source src={status.content_url} type="audio/mp3" />
              </audio>
            )}
            <p className="mt-1 text-sm font-medium text-[#ff6200] truncate">{status.caption}</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-700">
              <span>Views: {status.status_views.length}</span>
              <span>Reactions: {status.status_reactions.length}</span>
              <span>Comments: {status.status_comments.length}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{new Date(status.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileStatusDashboard;
