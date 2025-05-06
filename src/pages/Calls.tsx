
import React from 'react';
import { Phone, Video } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';

// Sample call data
const sampleCalls = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    timestamp: '10:30 AM',
    type: 'video' as const,
    status: 'missed' as const,
    direction: 'incoming' as const
  },
  {
    id: '2',
    name: 'Mike Peterson',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    timestamp: 'Yesterday',
    type: 'audio' as const,
    status: 'completed' as const,
    direction: 'outgoing' as const,
    duration: '12:45'
  },
  {
    id: '3',
    name: 'Jennifer Williams',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    timestamp: 'Monday',
    type: 'audio' as const,
    status: 'completed' as const,
    direction: 'incoming' as const,
    duration: '4:20'
  }
];

const Calls: React.FC = () => {
  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <h1 className="text-2xl font-bold">Calls</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        {sampleCalls.length > 0 ? (
          sampleCalls.map(call => (
            <div 
              key={call.id}
              className="px-4 py-3 border-b flex items-center hover:bg-gray-50"
            >
              <Avatar src={call.avatar} alt={call.name} />
              
              <div className="flex-1 ml-3">
                <h3 className="font-medium">{call.name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  {call.direction === 'incoming' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-1 ${call.status === 'missed' ? 'text-red-500' : 'text-green-500'}`}>
                      <path d="m15 9-6 6"></path>
                      <path d="m9 9 6 6"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-green-500">
                      <path d="m9 9 6 6"></path>
                      <path d="m9 15 6-6"></path>
                    </svg>
                  )}
                  
                  {call.status === 'missed' ? (
                    <span className="text-red-500">Missed</span>
                  ) : (
                    <>
                      {call.duration && <span className="mr-1">{call.duration}</span>}
                      <span>{call.timestamp}</span>
                    </>
                  )}
                </div>
              </div>
              
              <button className="p-2 text-wispa-500 hover:bg-gray-100 rounded-full">
                {call.type === 'video' ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <Phone className="h-5 w-5" />
                )}
              </button>
            </div>
          ))
        ) : (
          <EmptyState
            title="No call history yet"
            description="Make a call to see your call history here"
            icon={<Phone className="h-12 w-12 mb-4 text-wispa-500" />}
          />
        )}
      </div>
      
      <NavBar />
    </div>
  );
};

export default Calls;
