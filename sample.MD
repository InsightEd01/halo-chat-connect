import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Adjust path to your Supabase client
import { shuffleArray } from './utils'; // Utility function for shuffling public posts

// Create Status Modal
function CreateStatusModal({ user, onClose, onPost }) {
  const [contentType, setContentType] = useState('image');
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handlePost = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('status-media')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { publicURL } = supabase.storage.from('status-media').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('statuses').insert({
        user_id: user.id,
        content_type: contentType,
        content_url: publicURL,
        caption,
        visibility,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;

      onPost();
      onClose();
    } catch (error) {
      console.error('Error posting status:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Status</h2>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
        <input
          type="file"
          accept={contentType === 'image' ? 'image/*' : contentType === 'video' ? 'video/*' : 'audio/*'}
          onChange={handleFileChange}
          className="w-full mb-4"
        />
        <input
          type="text"
          placeholder="Add a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <div className="mb-4">
          <label className="mr-4">
            <input
              type="radio"
              value="friends"
              checked={visibility === 'friends'}
              onChange={() => setVisibility('friends')}
            /> Friends Only
          </label>
          <label>
            <input
              type="radio"
              value="public"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
            /> Public
          </label>
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button
            onClick={handlePost}
            disabled={uploading || !file}
            className="px-4 py-2 bg-[#ff6200] text-white rounded disabled:opacity-50"
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Status Feed Component
function StatusFeed({ user, viewMode, setViewMode }) {
  const [statuses, setStatuses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchStatuses = async () => {
      let query = supabase.from('statuses').select(`
        *,
        users!statuses_user_id_fkey(user_id, email, avatar_url),
        status_views(count),
        status_reactions(reaction_type),
        status_comments(comment)
      `);

      if (viewMode === 'friends') {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('contact_user_id')
          .eq('user_id', user.id);
        const contactIds = contacts.map((c) => c.contact_user_id);
        query = query
          .in('user_id', contactIds)
          .or('visibility.eq.friends,visibility.eq.public')
          .order('created_at', { ascending: false });
      } else {
        query = query.eq('visibility', 'public').order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching statuses:', error);
        return;
      }

      const shuffledData = viewMode === 'public' ? shuffleArray([...data]) : data;
      setStatuses(shuffledData);
    };

    fetchStatuses();

    const subscription = supabase
      .from('statuses')
      .on('INSERT', (payload) => {
        setStatuses((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeSubscription(subscription);
  }, [viewMode, user.id]);

  const recordView = async (statusId) => {
    const { data } = await supabase
      .from('status_views')
      .select('id')
      .eq('status_id', statusId)
      .eq('viewer_id', user.id);
    if (data.length > 0) return;

    await supabase.from('status_views').insert({
      status_id: statusId,
      viewer_id: user.id,
      viewed_at: new Date().toISOString(),
    });
  };

  const handleReact = async (statusId, reactionType) => {
    const { data } = await supabase
      .from('status_reactions')
      .select('id')
      .eq('status_id', statusId)
      .eq('user_id', user.id);
    if (data.length > 0) {
      await supabase
        .from('status_reactions')
        .update({ reaction_type: reactionType })
        .eq('status_id', statusId)
        .eq('user_id', user.id);
    } else {
      await supabase.from('status_reactions').insert({
        status_id: statusId,
        user_id: user.id,
        reaction_type: reactionType,
        created_at: new Date().toISOString(),
      });
    }
  };

  const handleComment = async (statusId, comment) => {
    await supabase.from('status_comments').insert({
      status_id: statusId,
      user_id: user.id,
      comment,
      created_at: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex justify-between items-center p-4 bg-white shadow">
        <h2 className="text-xl font-bold text-gray-800">Status</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#ff6200] text-white px-4 py-2 rounded-full"
          >
            Create Status
          </button>
        </div>
      </header>
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 ${viewMode === 'friends' ? 'bg-[#ff6200] text-white' : 'bg-[#ffe6e6]'}`}
          onClick={() => setViewMode('friends')}
        >
          Friends Posts
        </button>
        <button
          className={`flex-1 py-2 ${viewMode === 'public' ? 'bg-[#ff6200] text-white' : 'bg-[#ffe6e6]'}`}
          onClick={() => setViewMode('public')}
        >
          Public Posts
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {statuses.map((status) => (
          <div
            key={status.id}
            className="relative w-full h-[80vh] bg-gray-100 flex flex-col justify-between"
            onClick={() => recordView(status.id)}
          >
            {status.content_type === 'image' && (
              <img src={status.content_url} alt="Status" className="w-full h-full object-cover" />
            )}
            {status.content_type === 'video' && (
              <video controls className="w-full h-full object-cover">
                <source src={status.content_url} type="video/mp4" />
              </video>
            )}
            {status.content_type === 'audio' && (
              <audio controls className="w-full p-4">
                <source src={status.content_url} type="audio/mp3" />
              </audio>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4 text-white">
              <div className="flex items-center mb-2">
                <img
                  src={status.users.avatar_url || '/default-avatar.png'}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full mr-2"
                />
                <span>{status.users.email}</span>
              </div>
              <p>{status.caption}</p>
              <div className="flex gap-4 mt-2">
                <span>Views: {status.status_views.length}</span>
                <span>Reactions: {status.status_reactions.length}</span>
                <span>Comments: {status.status_comments.length}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleReact(status.id, 'like')}>👍</button>
                <button onClick={() => handleReact(status.id, 'love')}>❤️</button>
                <button onClick={() => handleReact(status.id, 'haha')}>😂</button>
              </div>
              <input
                type="text"
                placeholder="Add a comment..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    handleComment(status.id, e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full p-2 mt-2 text-black rounded"
              />
            </div>
          </div>
        ))}
      </div>
      {showCreateModal && (
        <CreateStatusModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onPost={() => fetchStatuses()}
        />
      )}
    </div>
  );
}

// Profile Dashboard Component
function ProfileDashboard({ user }) {
  const [myStatuses, setMyStatuses] = useState([]);

  useEffect(() => {
    const fetchMyStatuses = async () => {
      const { data, error } = await supabase
        .from('statuses')
        .select(`
          *,
          status_views(count),
          status_reactions(reaction_type),
          status_comments(comment)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching my statuses:', error);
        return;
      }
      setMyStatuses(data);
    };

    fetchMyStatuses();

    const subscription = supabase
      .from('statuses')
      .on('INSERT', (payload) => {
        if (payload.new.user_id === user.id) {
          setMyStatuses((prev) => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => supabase.removeSubscription(subscription);
  }, [user.id]);

  return (
    <div className="flex flex-col p-4 bg-white">
      <h2 className="text-xl font-bold mb-4">My Statuses</h2>
      <div className="grid grid-cols-2 gap-4">
        {myStatuses.map((status) => (
          <div key={status.id} className="border rounded-lg p-2">
            {status.content_type === 'image' && (
              <img src={status.content_url} alt="Status" className="w-full h-32 object-cover rounded" />
            )}
            {status.content_type === 'video' && (
              <video className="w-full h-32 object-cover rounded">
                <source src={status.content_url} type="video/mp4" />
              </video>
            )}
            {status.content_type === 'audio' && (
              <audio controls className="w-full">
                <source src={status.content_url} type="audio/mp3" />
              </audio>
            )}
            <p className="mt-2">{status.caption}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span>Views: {status.status_views.length}</span>
              <span>Reactions: {status.status_reactions.length}</span>
              <span>Comments: {status.status_comments.length}</span>
            </div>
            <p className="text-xs text-gray-600">{new Date(status.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Status Component
function StatusTab({ user }) {
  const [viewMode, setViewMode] = useState('friends');

  return (
    <div className="flex flex-col h-screen">
      <StatusFeed user={user} viewMode={viewMode} setViewMode={setViewMode} />
    </div>
  );
}

export default StatusTab;




Comprehensive Instruction for Adding a Status Tab Feature
This instruction provides a complete, one-time guide for a developer to implement a status tab feature in the existing WhatsApp-like web app, inspired by Facebook Reels or TikTok. The feature allows users to post multimedia content (images, videos, audios) with visibility settings (friends only or public), view posts in a vertical scrolling feed, and track their posts’ performance via a profile dashboard. The implementation uses Supabase for backend operations and React with Tailwind CSS for the frontend, matching the "Halodek" design’s aesthetic.

Project Context
The existing app is a web-based messaging platform using Supabase for authentication, real-time messaging, and data storage. It uses a 6-digit user ID instead of phone numbers, supports email and Google registration, and allows in-app contact saving. The UI replicates the "Halodek" mockup, featuring a welcome screen, chat list, and conversation screen with orange (#ff6200) and peach (#ffe6e6) colors. The new status tab will enhance the app with social media-like functionality, integrating seamlessly with the existing infrastructure.

Feature Requirements
Status Creation:
Users can upload images, videos, or audios with an optional caption.
Visibility options: "friends only" (visible to mutual contacts) or "public" (visible to all users).
Media is stored in Supabase storage, with metadata saved in the database.
Status Feed:
Two modes: "Friends Posts" (shows posts from mutual contacts with "friends" or "public" visibility) and "Public Posts" (shows all public posts in random order).
Vertical scrolling feed, with each post occupying the full screen width, styled like TikTok or Reels.
Displays user avatar, name (or email), caption, and interaction counts (views, reactions, comments).
Interactions:
Views are recorded uniquely per user per status.
Reactions include predefined options (e.g., like, love, haha).
Comments support text input, with potential for nested replies.
Optional: Allow sharing posts via a link or in-app mechanism.
Profile Dashboard:
Displays a user’s own statuses in a grid or list format.
Shows statistics: view count, reaction count, comment count, and post date.
Accessible via a profile section or button.
Real-Time Functionality:
New statuses, views, reactions, and comments update the UI in real-time using Supabase subscriptions.
UI Design:
Matches the "Halodek" aesthetic: orange (#ff6200) for active elements, peach (#ffe6e6) for inactive elements, white background, rounded corners.
Integrates with existing navigation tabs (Chat, Status, Calls), with Status highlighted when active.
Database Schema Extensions
Extend the Supabase database with the following tables:


Table Name	Fields
statuses	id (UUID, primary key), user_id (UUID, foreign key to users.id), content_type (text: 'image', 'video', 'audio'), content_url (text, media URL), caption (text, optional), visibility (text: 'friends', 'public'), created_at (timestamp), updated_at (timestamp)
status_views	id (UUID, primary key), status_id (UUID, foreign key to statuses.id), viewer_id (UUID, foreign key to users.id), viewed_at (timestamp), unique constraint on (status_id, viewer_id)
status_reactions	id (UUID, primary key), status_id (UUID, foreign key to statuses.id), user_id (UUID, foreign key to users.id), reaction_type (text: 'like', 'love', 'haha', etc.), created_at (timestamp), unique constraint on (status_id, user_id)
status_comments	id (UUID, primary key), status_id (UUID, foreign key to statuses.id), user_id (UUID, foreign key to users.id), comment (text), created_at (timestamp), parent_comment_id (UUID, optional for nested comments)
Implementation Steps
Set Up Supabase:
Create a storage bucket named status-media in Supabase with public access for media URLs.
Set up the database tables as defined above.
Enable Row Level Security (RLS) to enforce visibility:
For statuses, allow read access based on visibility:
Public: All authenticated users can read.
Friends: Only mutual contacts (users in the contacts table bidirectionally) can read.
Example RLS policy for statuses:
sql



CREATE POLICY "Friends and public can view statuses" ON statuses
FOR SELECT
USING (
  visibility = 'public' OR
  (visibility = 'friends' AND EXISTS (
    SELECT 1 FROM contacts c1
    JOIN contacts c2 ON c1.contact_user_id = c2.user_id
    WHERE c1.user_id = auth.uid() AND c2.contact_user_id = auth.uid()
    AND c1.contact_user_id = statuses.user_id
  ))
);
Allow authenticated users to insert and select from status_views, status_reactions, and status_comments.
Frontend Setup:
Use React with Tailwind CSS, ensuring compatibility with the existing app.
Add the StatusTab component to the main navigation, alongside "Chat" and "Calls."
Style the UI to match the "Halodek" design: orange (#ff6200) for active tabs/buttons, peach (#ffe6e6) for inactive elements, white background, rounded corners.
Status Creation:
Implement a CreateStatusModal component allowing users to:
Select media type (image, video, audio) via a dropdown.
Upload a file to Supabase storage.
Add an optional caption.
Choose visibility (friends only or public) via radio buttons.
Store media in the status-media bucket with a unique filename (e.g., user_id/timestamp.extension).
Save metadata in the statuses table.
Example backend logic:
javascript




async function createStatus(userId, contentType, contentUrl, caption, visibility) {
  const { error } = await supabase.from('statuses').insert({
    user_id: userId,
    content_type: contentType,
    content_url: contentUrl,
    caption,
    visibility,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
Status Feed:
Implement a StatusFeed component with two modes:
Friends Posts: Fetch statuses from mutual contacts with "friends" or "public" visibility, ordered by created_at.
javascript




async function getFriendsPosts(userId) {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('contact_user_id')
    .eq('user_id', userId);
  const contactIds = contacts.map((c) => c.contact_user_id);
  const { data, error } = await supabase
    .from('statuses')
    .select('*, users!statuses_user_id_fkey(user_id, email, avatar_url)')
    .in('user_id', contactIds)
    .or('visibility.eq.friends,visibility.eq.public')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
Public Posts: Fetch all public statuses and shuffle them for randomness.
javascript




async function getPublicPosts() {
  const { data, error } = await supabase
    .from('statuses')
    .select('*, users!statuses_user_id_fkey(user_id, email, avatar_url)')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return shuffleArray(data);
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
Display each post with:
Media (image, video with controls, or audio with a progress bar).
User avatar, name (or email), and caption.
Interaction counts (views, reactions, comments) and buttons for reacting and commenting.
Style the feed with full-width posts, ensuring a TikTok-like vertical scrolling experience.
Interactions:
Views: Record a view only if the user hasn’t viewed the status before.
javascript




async function recordView(statusId, viewerId) {
  const { data } = await supabase
    .from('status_views')
    .select('id')
    .eq('status_id', statusId)
    .eq('viewer_id', viewerId);
  if (data.length > 0) return;
  await supabase.from('status_views').insert({
    status_id: statusId,
    viewer_id: viewerId,
    viewed_at: new Date().toISOString(),
  });
}
Reactions: Allow one reaction per user, updating if changed.
javascript




async function handleReact(statusId, userId, reactionType) {
  const { data } = await supabase
    .from('status_reactions')
    .select('id')
    .eq('status_id', statusId)
    .eq('user_id', userId);
  if (data.length > 0) {
    await supabase
      .from('status_reactions')
      .update({ reaction_type: reactionType })
      .eq('status_id', statusId)
      .eq('user_id', userId);
  } else {
    await supabase.from('status_reactions').insert({
      status_id: statusId,
      user_id: userId,
      reaction_type: reactionType,
      created_at: new Date().toISOString(),
    });
  }
}
Comments: Insert comments with optional parent IDs for nested replies.
javascript




async function handleComment(statusId, userId, comment, parentCommentId = null) {
  await supabase.from('status_comments').insert({
    status_id: statusId,
    user_id: userId,
    comment,
    created_at: new Date().toISOString(),
    parent_comment_id: parentCommentId,
  });
}
Profile Dashboard:
Implement a ProfileDashboard component to display the user’s statuses in a grid or list.
Fetch statuses and their stats (views, reactions, comments) from Supabase.
Display thumbnails, captions, and stats (views, reactions, comments, post date) for each status.
Add a route or button to access the dashboard from the profile section.
Real-Time Updates:
Use Supabase real-time subscriptions to listen for new statuses, views, reactions, and comments.
Update the UI dynamically when new data is received.
Example:
javascript




useEffect(() => {
  const subscription = supabase
    .from('statuses')
    .on('INSERT', (payload) => {
      setStatuses((prev) => [payload.new, ...prev]);
    })
    .subscribe();
  return () => supabase.removeSubscription(subscription);
}, []);
Security and Privacy:
Ensure RLS policies enforce visibility settings:
Public statuses are readable by all authenticated users.
Friends-only statuses are readable only by