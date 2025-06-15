
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Status: React.FC = () => {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  // Try to get username from profile first, then from metadata, then fallback to email
  const username =
    profile?.username ||
    (user.user_metadata && (user.user_metadata.username || user.user_metadata.full_name)) ||
    user.email;

  // Avatar from profile, metadata, or fallback
  const avatarUrl =
    profile?.avatar_url ||
    (user.user_metadata && user.user_metadata.avatar_url) ||
    '/default-avatar.png';

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-4">User Status</h2>
        <div className="mb-4 flex flex-col items-center">
          <img 
            src={avatarUrl}
            alt={username}
            className="h-12 w-12 rounded-full"
          />
        </div>
        <p><strong>Username:</strong> {username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <button 
          onClick={handleLogout}
          className="mt-6 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Logout
        </button>
        <button
          onClick={() => navigate('/status')}
          className="mt-3 bg-wispa-500 hover:bg-wispa-600 text-white font-semibold py-2 px-4 rounded w-full"
        >
          Go to Status
        </button>
      </div>
    </div>
  );
};

export default Status;
