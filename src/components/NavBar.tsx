
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Phone, User, Users } from 'lucide-react';
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
    <div className="wispa-navbar">
      <Link
        to="/chats"
        className={cn(
          "wispa-navbar-item",
          isActive('/chats') && "wispa-navbar-item-active"
        )}
      >
        <MessageSquare className="h-6 w-6" />
        <span className="text-xs mt-1">Chats</span>
      </Link>
      
      <Link
        to="/calls"
        className={cn(
          "wispa-navbar-item",
          isActive('/calls') && "wispa-navbar-item-active"
        )}
      >
        <Phone className="h-6 w-6" />
        <span className="text-xs mt-1">Calls</span>
      </Link>
      
      <Link
        to="/friends"
        className={cn(
          "wispa-navbar-item relative",
          isActive('/friends') && "wispa-navbar-item-active"
        )}
      >
        <Users className="h-6 w-6" />
        {pendingRequests.length > 0 && (
          <span className="absolute top-0 right-4 bg-red-500 text-white text-xs rounded-full h-4 min-w-[1rem] flex items-center justify-center">
            {pendingRequests.length}
          </span>
        )}
        <span className="text-xs mt-1">Friends</span>
      </Link>
      
      <Link
        to="/profile"
        className={cn(
          "wispa-navbar-item",
          isActive('/profile') && "wispa-navbar-item-active"
        )}
      >
        <User className="h-6 w-6" />
        <span className="text-xs mt-1">Profile</span>
      </Link>
    </div>
  );
};

export default NavBar;
