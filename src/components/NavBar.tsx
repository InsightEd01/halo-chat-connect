import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Phone, ImageIcon, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFriendRequests } from '@/services/friendService';

const NavBar: React.FC = () => {
  const location = useLocation();
  const [activePath, setActivePath] = useState('/chats');
  const { data: friendRequests } = useFriendRequests();
  
  const pendingRequests = friendRequests?.received?.filter(req => req.status === 'pending') || [];
  
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/chat/')) {
      setActivePath('/chats');
    } else if (path.startsWith('/call/')) {
      setActivePath('/calls');
    } else {
      setActivePath(path);
    }
  }, [location]);

  const isActive = (path: string) => activePath === path;

  return (
    <nav className="wispa-navbar bg-white dark:bg-gray-900 border-t dark:border-gray-700 py-2 shadow-lg fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 flex items-center justify-around">
      <Link
        to="/chats"
        className={cn(
          "wispa-navbar-item group",
          isActive('/chats') && "wispa-navbar-item-active"
        )}
      >
        <MessageSquare className="h-6 w-6" />
        <span className="text-xs mt-1">Chats</span>
      </Link>

      <Link
        to="/friends"
        className={cn(
          "wispa-navbar-item group relative",
          isActive('/friends') && "wispa-navbar-item-active"
        )}
      >
        <Users className="h-6 w-6" />
        <span className="text-xs mt-1">Friends</span>
        {pendingRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {pendingRequests.length}
          </span>
        )}
      </Link>
      
      <Link
        to="/status"
        className={cn(
          "wispa-navbar-item group",
          isActive('/status') && "wispa-navbar-item-active"
        )}
      >
        <ImageIcon className="h-6 w-6" />
        <span className="text-xs mt-1">Status</span>
      </Link>
      
      <Link
        to="/calls"
        className={cn(
          "wispa-navbar-item group",
          isActive('/calls') && "wispa-navbar-item-active"
        )}
      >
        <Phone className="h-6 w-6" />
        <span className="text-xs mt-1">Calls</span>
      </Link>
      
      <Link
        to="/profile"
        className={cn(
          "wispa-navbar-item group relative",
          isActive('/profile') && "wispa-navbar-item-active"
        )}
      >
        <User className="h-6 w-6" />
        {pendingRequests.length > 0 && (
          <span className="absolute top-0 right-2 bg-red-500 text-white text-xs rounded-full h-4 min-w-[1rem] flex items-center justify-center">
            {pendingRequests.length}
          </span>
        )}
        <span className="text-xs mt-1">Profile</span>
      </Link>
    </nav>
  );
};

export default NavBar;
