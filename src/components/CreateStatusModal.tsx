import React, { useState } from "react";

const CreateStatusModal = ({ user, onClose, onPost }) => {
  // Option type for post options
  type OptionType = '' | 'media' | 'gif' | 'poll' | 'adoption' | 'event' | 'notice';
  const [contentType, setContentType] = useState('image');
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState<OptionType>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle file preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // Remove file and preview
  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-border flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border">
          <button onClick={onClose} className="text-xl text-muted-foreground hover:text-primary transition">&times;</button>
          <span className="font-semibold text-lg text-foreground">Create Post</span>
          <button
            onClick={onPost}
            disabled={uploading || (!file && !caption)}
            className={`rounded-full px-4 py-1 font-semibold text-sm ml-2 transition wispa-btn wispa-btn-primary ${(!file && !caption) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-1">
          {/* Avatar */}
          <div className="h-10 w-10">
            {/* You can use your Avatar component here if you want */}
            <img src={user?.avatar_url || '/placeholder.svg'} alt="avatar" className="h-10 w-10 rounded-full object-cover bg-gray-200" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{user?.username || 'You'}</span>
            {/* Optionally, add a badge or verification icon here */}
          </div>
        </div>

        {/* Caption Input */}
        <div className="px-4 pt-2 pb-1">
          <textarea
            className="w-full min-h-[60px] max-h-40 resize-none bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="What do you want to talk about?"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            autoFocus
          />
        </div>

        {/* Post Preview */}
        {previewUrl && (
          <div className="px-4 pb-2">
            {file?.type.startsWith('image') && (
              <img src={previewUrl} alt="preview" className="max-h-48 rounded-lg border mb-2 mx-auto" />
            )}
            {file?.type.startsWith('video') && (
              <video src={previewUrl} controls className="max-h-48 rounded-lg border mb-2 mx-auto" />
            )}
            {file?.type.startsWith('audio') && (
              <audio src={previewUrl} controls className="w-full mb-2" />
            )}
            <div className="flex justify-end">
              <button onClick={handleRemoveFile} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
          </div>
        )}

        {/* Media & Options */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              onClick={() => setShowOptions(showOptions === 'media' ? '' : 'media')}
              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg bg-muted hover:bg-accent text-foreground text-xs font-medium border border-border transition"
            >
              <span role="img" aria-label="media" className="text-lg">🖼️</span>
              Photo/Video
            </button>
            <button
              onClick={() => setShowOptions(showOptions === 'gif' ? '' : 'gif')}
              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg bg-muted hover:bg-accent text-foreground text-xs font-medium border border-border transition"
            >
              <span role="img" aria-label="gif" className="text-lg">GIF</span>
              GIF
            </button>
            <button
              onClick={() => setShowOptions(showOptions === 'poll' ? '' : 'poll')}
              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg bg-muted hover:bg-accent text-foreground text-xs font-medium border border-border transition"
            >
              <span role="img" aria-label="poll" className="text-lg">📊</span>
              Poll
            </button>
            <button
              onClick={() => setShowOptions(showOptions === 'adoption' ? '' : 'adoption')}
              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg bg-muted hover:bg-accent text-foreground text-xs font-medium border border-border transition"
            >
              <span role="img" aria-label="adoption" className="text-lg">📋</span>
              Adoption
            </button>
            <button
              onClick={() => setShowOptions(showOptions === 'event' ? '' : 'event')}
              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg bg-muted hover:bg-accent text-foreground text-xs font-medium border border-border transition"
            >
              <span role="img" aria-label="event" className="text-lg">📅</span>
              Event
            </button>
            <button
              onClick={() => setShowOptions(showOptions === 'notice' ? '' : 'notice')}
              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg bg-muted hover:bg-accent text-foreground text-xs font-medium border border-border transition"
            >
              <span role="img" aria-label="notice" className="text-lg">📢</span>
              Lost Notice
            </button>
          </div>
          {/* Option Inputs */}
          {showOptions === 'media' && (
            <div className="mt-2 flex flex-col gap-2">
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-muted file:text-foreground"
              />
            </div>
          )}
          {showOptions === 'gif' && (
            <div className="mt-2 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Paste GIF URL or search..."
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
          )}
          {showOptions === 'poll' && (
            <div className="mt-2 flex flex-col gap-2">
              <input type="text" placeholder="Poll question..." className="w-full p-2 border rounded focus:ring-2 focus:ring-primary bg-background text-foreground" />
              <input type="text" placeholder="Option 1" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary bg-background text-foreground" />
              <input type="text" placeholder="Option 2" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary bg-background text-foreground" />
              {/* Add logic for more options if needed */}
            </div>
          )}
          {showOptions === 'adoption' && (
            <div className="mt-2 flex flex-col gap-2">
              <input type="text" placeholder="Adoption details..." className="w-full p-2 border rounded focus:ring-2 focus:ring-primary bg-background text-foreground" />
            </div>
          )}
          {showOptions === 'event' && (
            <div className="mt-2 flex flex-col gap-2">
              <input type="text" placeholder="Event details..." className="w-full p-2 border rounded focus:ring-2 focus:ring-primary bg-background text-foreground" />
            </div>
          )}
          {showOptions === 'notice' && (
            <div className="mt-2 flex flex-col gap-2">
              <input type="text" placeholder="Lost notice details..." className="w-full p-2 border rounded focus:ring-2 focus:ring-primary bg-background text-foreground" />
            </div>
          )}
        </div>

        {/* Visibility & Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50 rounded-b-2xl">
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="radio"
                value="friends"
                checked={visibility === 'friends'}
                onChange={() => setVisibility('friends')}
                className="accent-primary"
              />{' '}Friends
            </label>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="radio"
                value="public"
                checked={visibility === 'public'}
                onChange={() => setVisibility('public')}
                className="accent-primary"
              />{' '}Public
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStatusModal;
