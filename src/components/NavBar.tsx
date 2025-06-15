
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Phone, ImageIcon, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from './Avatar';

const tabs = [
  { path: '/chats', label: "Chats", Icon: MessageSquare },
  { path: '/status', label: "Status", Icon: ImageIcon },
  { path: '/calls', label: "Calls", Icon: Phone },
  { path: '/profile', label: "Profile", Icon: User }
];

const NavBar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const activePath = tabs.find(tab => location.pathname.startsWith(tab.path))?.path ?? "/chats";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card/90 border-t flex items-center justify-around py-0 px-2 h-16 shadow-t-lg">
      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-extrabold px-4 py-1 rounded-full text-xs border-2 border-white shadow select-none z-10 pointer-events-none">
        WispaChat
      </span>
      {tabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full px-1",
            activePath === tab.path ? "text-primary font-semibold" : "text-muted-foreground"
          )}
        >
          {tab.label === "Profile" && user?.avatar_url
            ? <Avatar src={user.avatar_url} alt="You" size="sm" className="mb-0.5 border border-primary" />
            : <tab.Icon className="h-6 w-6 mb-0.5" />}
          <span className="text-2xs">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default NavBar;
