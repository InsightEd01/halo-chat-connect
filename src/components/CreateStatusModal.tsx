import React, { useState } from "react";

const CreateStatusModal = ({ user, onClose, onPost }) => {
  const [contentType, setContentType] = useState('image');
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [uploading, setUploading] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl animate-fade-in">
        <h2 className="text-xl font-bold mb-4 text-[#ff6200]">Create Status</h2>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-[#ff6200]"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
        <input
          type="file"
          accept={contentType === 'image' ? 'image/*' : contentType === 'video' ? 'video/*' : 'audio/*'}
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full mb-4 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-[#ffe6e6] file:text-[#ff6200]"
        />
        <input
          type="text"
          placeholder="Add a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-[#ff6200]"
        />
        <div className="mb-4 flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="friends"
              checked={visibility === 'friends'}
              onChange={() => setVisibility('friends')}
              className="accent-[#ff6200]"
            /> Friends Only
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="public"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
              className="accent-[#ff6200]"
            /> Public
          </label>
        </div>
        <div className="flex justify-end gap-4 mt-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">Cancel</button>
          <button
            onClick={onPost}
            disabled={uploading || !file}
            className="px-4 py-2 bg-[#ff6200] text-white rounded shadow disabled:opacity-50 hover:bg-[#ff7f32] transition"
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStatusModal;
