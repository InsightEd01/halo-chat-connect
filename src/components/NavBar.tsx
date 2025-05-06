
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Phone, Users, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavBar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const { signOut, user } = useAuth();
  
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
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-col items-center py-3 px-6 text-gray-500 hover:text-gray-800">
          <User className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Profile</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NavBar;
