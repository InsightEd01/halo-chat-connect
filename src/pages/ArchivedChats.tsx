
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Archive } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import NavBar from '@/components/NavBar';

const ArchivedChats: React.FC = () => {
  // For now, we'll show an empty state since archived chats functionality 
  // would require backend implementation
  const archivedChats: any[] = [];

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <div className="flex items-center">
          <Link to="/chats" className="mr-2 text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="font-medium text-white">Archived Chats</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {archivedChats.length > 0 ? (
          archivedChats.map(chat => (
            // Chat items would be rendered here
            <div key={chat.id}>
              {/* Chat content */}
            </div>
          ))
        ) : (
          <EmptyState
            title="No archived chats"
            description="Chats that you archive will appear here"
            icon={<Archive className="h-12 w-12 mb-4 text-gray-400" />}
          />
        )}
      </div>

      <NavBar />
    </div>
  );
};

export default ArchivedChats;
