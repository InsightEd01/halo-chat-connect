import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ProfileStatusDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myStatuses, setMyStatuses] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchMyStatuses = async () => {
      const { data, error } = await supabase
        .from('status_updates')
        .select(`*, status_views(count), status_reactions(reaction_type), status_comments(comment)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) setMyStatuses(data);
    };
    fetchMyStatuses();
  }, [user.id]);

  return (
    <div className="flex flex-col p-4 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-bold">My Statuses</h2>
        <Link to="/profile/status-dashboard">
          <Button className="bg-[#ff6200] hover:bg-[#ff7f32] text-white rounded-full px-6 py-2 shadow">
            My Status Dashboard
          </Button>
        </Link>
        <Link to="/profile">
          <Button variant="outline" className="rounded-full px-4 py-1 text-sm">Back to Profile</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {myStatuses.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center h-32 text-muted-foreground text-lg">No statuses yet.</div>
        ) : myStatuses.map((status) => (
          <div key={status.id} className="border border-border rounded-lg p-2 bg-card shadow hover:shadow-lg transition flex flex-col">
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
            <p className="mt-1 text-sm font-medium text-primary truncate">{status.caption}</p>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
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
