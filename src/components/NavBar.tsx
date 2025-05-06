
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Phone, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavBar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  
  const tabs = [
    {
      name: 'Chats',
      icon: MessageSquare,
      path: '/chats'
    },
    {
      name: 'Calls',
      icon: Phone,
      path: '/calls'
    },
    {
      name: 'Status',
      icon: Users,
      path: '/status'
    },
    {
      name: 'Profile',
      icon: User,
      path: '/profile'
    }
  ];

  return (
    <div className="bg-white border-t flex justify-around items-center">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          to={tab.path}
          className={cn(
            "flex flex-col items-center py-3 px-6", 
            path.startsWith(tab.path) 
              ? "text-wispa-500"
              : "text-gray-500 hover:text-gray-800"
          )}
        >
          <tab.icon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">{tab.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default NavBar;
