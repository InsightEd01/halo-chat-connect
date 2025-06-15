import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'away' | null;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = 'User', 
  size = 'md',
  status,
  className 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };

  return (
    <div className={cn("relative rounded-full overflow-hidden bg-gray-200", sizeClasses[size], className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-wispa-100 text-wispa-500 font-semibold">
          {alt?.charAt(0)?.toUpperCase() ?? "U"}
        </div>
      )}
      {status && (
        <div className={cn(
          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
          {
            'bg-green-500': status === 'online',
            'bg-gray-400': status === 'offline',
            'bg-yellow-500': status === 'away'
          }
        )} />
      )}
    </div>
  );
};
export default Avatar;
