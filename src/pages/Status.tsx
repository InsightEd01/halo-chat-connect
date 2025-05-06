
import React from 'react';
import { plus, camera } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';

// Sample status data
const myStatus = {
  hasStatus: false,
  lastUpdated: null
};

const sampleStatuses = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    timestamp: '10:30 AM',
    viewed: false
  },
  {
    id: '2',
    name: 'Mike Peterson',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    timestamp: '1 hour ago',
    viewed: true
  },
  {
    id: '3',
    name: 'Jennifer Williams',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    timestamp: '3 hours ago',
    viewed: true
  }
];

const Status: React.FC = () => {
  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <h1 className="text-2xl font-bold">Status</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        {/* My Status section */}
        <div className="px-4 py-3 border-b">
          <h3 className="text-gray-500 text-sm mb-3">My Status</h3>
          <div className="flex items-center">
            <div className="relative">
              <Avatar
                size="lg"
                className={myStatus.hasStatus ? "border-2 border-wispa-500" : ""}
              />
              <button className="absolute bottom-0 right-0 bg-wispa-500 text-white p-1.5 rounded-full">
                <plus className="h-4 w-4" />
              </button>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">My Status</h3>
              <p className="text-sm text-gray-500">
                {myStatus.hasStatus 
                  ? `Last updated ${myStatus.lastUpdated}`
                  : "Tap to add status update"}
              </p>
            </div>
          </div>
          <button className="mt-4 flex items-center text-wispa-500 font-medium text-sm">
            <camera className="h-4 w-4 mr-1" />
            Create photo status
          </button>
        </div>
        
        {/* Recent updates */}
        {sampleStatuses.length > 0 ? (
          <div>
            <h3 className="text-gray-500 text-sm px-4 py-3">Recent Updates</h3>
            {sampleStatuses.map(status => (
              <div 
                key={status.id}
                className="px-4 py-3 border-b flex items-center hover:bg-gray-50"
              >
                <Avatar 
                  src={status.avatar} 
                  alt={status.name} 
                  className={`border-2 ${status.viewed ? 'border-gray-300' : 'border-wispa-500'}`}
                />
                <div className="ml-3">
                  <h3 className="font-medium">{status.name}</h3>
                  <p className="text-sm text-gray-500">{status.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No status updates"
            description="When your contacts add status updates, you'll see them here"
          />
        )}
      </div>
      
      <NavBar />
    </div>
  );
};

export default Status;
