
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="wispa-container flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-wispa-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-5xl text-wispa-500">?</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-6">Sorry, the page you're looking for doesn't exist.</p>
      <Link 
        to="/chats" 
        className="bg-wispa-500 text-white px-6 py-2 rounded-md hover:bg-wispa-600 transition-colors"
      >
        Return to Chats
      </Link>
    </div>
  );
};

export default NotFound;
