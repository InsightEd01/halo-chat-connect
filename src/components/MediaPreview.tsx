
import React from 'react';
import { X, Download, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaPreviewProps {
  src: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name?: string;
  onRemove?: () => void;
  onDownload?: () => void;
  className?: string;
  showControls?: boolean;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  src,
  type,
  name,
  onRemove,
  onDownload,
  className = '',
  showControls = true
}) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = src;
      link.download = name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderMedia = () => {
    switch (type) {
      case 'image':
        return (
          <img
            src={src}
            alt={name || 'Preview'}
            className="w-full h-full object-cover rounded-lg"
          />
        );
      case 'video':
        return (
          <video
            src={src}
            controls
            className="w-full h-full rounded-lg"
            preload="metadata"
          />
        );
      case 'audio':
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <audio src={src} controls className="w-full" />
          </div>
        );
      case 'document':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg p-4">
            <FileIcon className="h-12 w-12 text-gray-500 mb-2" />
            <p className="text-sm text-gray-600 text-center truncate w-full">
              {name || 'Document'}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative bg-gray-50 rounded-lg overflow-hidden ${className}`}>
      {renderMedia()}
      
      {showControls && (
        <div className="absolute top-2 right-2 flex gap-1">
          {onDownload !== undefined && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-none"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-none"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaPreview;
