
import React from 'react';
import { MessageSquare } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <MessageSquare className="h-12 w-12 mb-4 text-wispa-500" />
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {icon}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 max-w-xs">{description}</p>
    </div>
  );
};

export default EmptyState;
