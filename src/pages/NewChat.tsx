
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { toast } from '@/components/ui/use-toast';

// Sample contact data
const sampleContacts = [
  {
    id: '6',
    name: 'Emily Cooper',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
    userId: '123456',
    status: null
  },
  {
    id: '7',
    name: 'Robert Wilson',
    avatar: 'https://randomuser.me/api/portraits/men/92.jpg',
    userId: '654321',
    status: 'online' as const
  },
  {
    id: '8',
    name: 'Sophia Garcia',
    avatar: 'https://randomuser.me/api/portraits/women/19.jpg',
    userId: '987654',
    status: null
  },
  {
    id: '9',
    name: 'James Taylor',
    avatar: 'https://randomuser.me/api/portraits/men/54.jpg',
    userId: '456789',
    status: 'away' as const
  },
];

const NewChat: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [idQuery, setIdQuery] = useState('');
  const [addingById, setAddingById] = useState(false);
  const navigate = useNavigate();

  // Filter contacts based on search query
  const filteredContacts = sampleContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddById = () => {
    // This would connect to Supabase to find a user by ID
    toast({
      title: "User ID Search",
      description: `Supabase integration needed to search for ID: ${idQuery}`,
    });
    
    // For demo purposes, we'll just create a fake contact
    if (idQuery.length === 6) {
      navigate(`/chat/new-${idQuery}`);
    } else {
      toast({
        title: "Invalid User ID",
        description: "User IDs must be 6 digits long",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="wispa-container">
      <header className="wispa-header">
        <div className="flex items-center">
          <Link to="/chats" className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="font-medium">New Chat</h2>
        </div>
      </header>
      
      <div className="p-3 bg-white border-b">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder={addingById ? "Enter 6-digit User ID" : "Search contacts..."}
            value={addingById ? idQuery : searchQuery}
            onChange={e => addingById ? setIdQuery(e.target.value) : setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        
        {addingById ? (
          <div className="flex mt-2 space-x-2">
            <button 
              className="flex-1 text-sm bg-gray-100 py-1.5 rounded"
              onClick={() => setAddingById(false)}
            >
              Cancel
            </button>
            <button 
              className="flex-1 text-sm bg-wispa-500 text-white py-1.5 rounded"
              onClick={handleAddById}
              disabled={idQuery.length !== 6}
            >
              Find User
            </button>
          </div>
        ) : (
          <button 
            className="mt-2 text-wispa-500 text-sm font-medium"
            onClick={() => setAddingById(true)}
          >
            Add a new chat using a User ID
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {!addingById && (
          <>
            {filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <Link
                  key={contact.id}
                  to={`/chat/${contact.id}`}
                  className="px-4 py-3 border-b flex items-center hover:bg-gray-50"
                >
                  <Avatar src={contact.avatar} alt={contact.name} status={contact.status} />
                  <div className="ml-3">
                    <h3 className="font-medium">{contact.name}</h3>
                    <p className="text-sm text-gray-500">ID: {contact.userId}</p>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                title="No contacts found"
                description={searchQuery ? "Try a different search term" : "Add contacts by searching their User ID"}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewChat;
