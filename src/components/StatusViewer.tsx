import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStatusUpdates } from '@/services/statusService';
import { StatusUpdate } from '@/types/status';
import StatusCard from './StatusCard';

interface StatusViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatusId?: string;
  statuses?: StatusUpdate[];
}

const StatusViewer: React.FC<StatusViewerProps> = ({
  isOpen,
  onClose,
  initialStatusId,
  statuses: providedStatuses
}) => {
  const { data: fetchedStatuses } = useStatusUpdates();
  const statuses = providedStatuses || fetchedStatuses || [];
  
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialStatusId) {
      const index = statuses.findIndex(s => s.id === initialStatusId);
      return index >= 0 ? index : 0;
    }
    return 0;
  });

  const currentStatus = statuses[currentIndex];

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentStatus) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-transparent max-w-none w-full h-full">
        <StatusCard
          status={currentStatus}
          onClose={onClose}
          onNext={currentIndex < statuses.length - 1 ? handleNext : undefined}
          onPrevious={currentIndex > 0 ? handlePrevious : undefined}
          showNavigation={statuses.length > 1}
        />
      </DialogContent>
    </Dialog>
  );
};

export default StatusViewer;
