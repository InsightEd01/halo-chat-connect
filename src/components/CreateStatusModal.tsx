import React, { useState } from "react";

const CreateStatusModal = ({ user, onClose, onPost }) => {
  const [contentType, setContentType] = useState('image');
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [uploading, setUploading] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-md shadow-xl animate-fade-in border border-border">
        <h2 className="text-xl font-bold mb-4 text-primary">Create Status</h2>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-primary bg-background text-foreground"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
        <input
          type="file"
          accept={contentType === 'image' ? 'image/*' : contentType === 'video' ? 'video/*' : 'audio/*'}
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full mb-4 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-muted file:text-foreground"
        />
        <input
          type="text"
          placeholder="Add a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-primary bg-background text-foreground"
        />
        <div className="mb-4 flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="friends"
              checked={visibility === 'friends'}
              onChange={() => setVisibility('friends')}
              className="accent-primary"
            /> Friends Only
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="public"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
              className="accent-primary"
            /> Public
          </label>
        </div>
        <div className="flex justify-end gap-4 mt-2">
          <button onClick={onClose} className="wispa-btn wispa-btn-secondary">Cancel</button>
          <button
            onClick={onPost}
            disabled={uploading || !file}
            className="wispa-btn wispa-btn-primary shadow disabled:opacity-50"
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStatusModal;
