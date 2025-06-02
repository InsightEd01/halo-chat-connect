
import React, { useCallback, useState } from 'react';
import { Upload, X, FileIcon, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  bucketType?: 'avatars' | 'chat_attachments' | 'documents' | 'status';
  className?: string;
  children?: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  bucketType = 'avatars',
  className = '',
  children
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
        variant: 'destructive',
      });
      return false;
    }

    const bucketLimits = {
      avatars: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      status: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
      chat_attachments: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav',
        'application/pdf', 'text/plain'
      ],
      documents: [
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    };

    if (!bucketLimits[bucketType].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a supported file type',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect, maxSize, bucketType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragOver ? 'border-wispa-500 bg-wispa-50' : 'border-gray-300 hover:border-wispa-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          id={`file-upload-${bucketType}`}
        />
        
        {children || (
          <label htmlFor={`file-upload-${bucketType}`} className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-gray-400">
                Max size: {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
