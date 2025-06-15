
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Phone, ImageIcon, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavBar: React.FC = () => {
  const location = useLocation();
  const [active, setActive] = useState('/chats');

  useEffect(() => {
    if (location.pathname.startsWith('/chat/')) setActive('/chats');
    else if (location.pathname.startsWith('/calls')) setActive('/calls');
    else if (location.pathname.startsWith('/status')) setActive('/status');
    else setActive(location.pathname);
  }, [location]);

  return (
    <nav className="wispa-navbar">
      <Link to="/chats" className={cn("wispa-navbar-item", active === '/chats' && "wispa-navbar-item-active")}>
        <MessageSquare className="h-6 w-6 mb-1" />
        Chats
      </Link>
      <Link to="/status" className={cn("wispa-navbar-item", active === '/status' && "wispa-navbar-item-active")}>
        <ImageIcon className="h-6 w-6 mb-1" />
        Status
      </Link>
      <Link to="/calls" className={cn("wispa-navbar-item", active === '/calls' && "wispa-navbar-item-active")}>
        <Phone className="h-6 w-6 mb-1" />
        Calls
      </Link>
      <Link to="/profile" className={cn("wispa-navbar-item", active === '/profile' && "wispa-navbar-item-active")}>
        <User className="h-6 w-6 mb-1" />
        Profile
      </Link>
    </nav>
  );
};
export default NavBar;
