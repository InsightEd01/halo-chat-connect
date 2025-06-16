import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStatusUpdates, useUpdateStatusView } from '@/services/statusService';
import { StatusUpdate } from '@/types/status';
import Avatar from './Avatar';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROGRESS_DURATION = 5000; // 5 seconds per status

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
  const updateStatusView = useUpdateStatusView();
  const statuses = providedStatuses || fetchedStatuses || [];
  
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialStatusId) {
      const index = statuses.findIndex(s => s.id === initialStatusId);
      return index >= 0 ? index : 0;
    }
    return 0;
  });

  const [progress, setProgress] = useState(0);
  const currentStatus = statuses[currentIndex];

  useEffect(() => {
    if (isOpen && currentStatus && !currentStatus.viewed) {
      updateStatusView.mutate({ statusId: currentStatus.id });
    }
  }, [currentStatus, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (PROGRESS_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex]);

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  if (!currentStatus) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] p-0 overflow-hidden bg-gray-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 text-white/80 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-40">
          {statuses.map((_, index) => (
            <div
              key={index}
              className="h-0.5 flex-1 bg-white/30 overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: `${index === currentIndex ? progress : index < currentIndex ? 100 : 0}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute top-0 left-0 right-0 p-4 z-30">
          <div className="flex items-center space-x-3">
            <Avatar user={currentStatus.user} size="md" />
            <div>
              <h3 className="text-white font-semibold">
                {currentStatus.user?.username || "User"}
              </h3>
              <p className="text-xs text-white/80">
                {new Date(currentStatus.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <button
          onClick={handlePrevious}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-40 p-2 text-white/80 hover:text-white",
            currentIndex === 0 && "hidden"
          )}
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        <button
          onClick={handleNext}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-40 p-2 text-white/80 hover:text-white",
            currentIndex === statuses.length - 1 && "hidden"
          )}
        >
          <ChevronRight className="h-8 w-8" />
        </button>

        {/* Status content */}
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          {currentStatus.type === 'image' && (
            <img
              src={currentStatus.media_url}
              alt="Status"
              className="max-w-full max-h-full object-contain"
            />
          )}
          {currentStatus.type === 'video' && (
            <video
              src={currentStatus.media_url}
              className="max-w-full max-h-full"
              autoPlay
              controls={false}
              onEnded={handleNext}
            />
          )}
          {currentStatus.type === 'text' && (
            <div className="max-w-lg p-6 text-center">
              <p className="text-xl text-white font-medium">{currentStatus.text}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusViewer;
