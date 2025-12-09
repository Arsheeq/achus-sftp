import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../api/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentFolder?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function FileUploadDialog({ open, onOpenChange, onSuccess, currentFolder = '/' }: FileUploadDialogProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      if (fileItem.status !== 'pending') continue;

      try {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'uploading', progress: 10 } : f
        ));

        const uploadData = await api.getUploadUrl(
          fileItem.file.name,
          fileItem.file.type || 'application/octet-stream',
          currentFolder
        );

        // Use XMLHttpRequest progress tracking for better UX with large files
        await api.uploadFile(
          fileItem.file, 
          uploadData.upload_url, 
          uploadData.upload_fields,
          (progress) => {
            // Map S3 upload progress (0-100) to overall progress (30-90)
            const mappedProgress = 30 + Math.round(progress * 0.6);
            setFiles(prev => prev.map((f, idx) => 
              idx === i ? { ...f, progress: mappedProgress } : f
            ));
          }
        );

        // Complete the upload to update file metadata
        const completeResponse = await fetch(`/api/files/${uploadData.file_id}/complete-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!completeResponse.ok) {
          console.error('Failed to complete upload metadata, but file was uploaded to S3');
        }

        // Update file metadata after successful upload
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'completed', progress: 100 } : f
        ));
        
        // Small delay to ensure S3 consistency
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        ));
      }
    }

    setUploading(false);
    const completed = files.filter(f => f.status === 'completed').length;
    
    if (completed > 0) {
      toast({
        title: 'Success',
        description: `Uploaded ${completed} file(s) successfully`,
      });
      onSuccess();
    }
  };

  const handleClose = () => {
    setFiles([]);
    onOpenChange(false);
  };

  const handleInteractOutside = (e: Event) => {
    if (uploading) {
      e.preventDefault();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !uploading && handleClose()}>
      <DialogContent 
        className="max-w-md sm:max-w-lg max-h-[90vh] overflow-hidden"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={(e) => uploading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Drag and drop files or click to browse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium text-sm sm:text-base">Drop files here...</p>
            ) : (
              <>
                <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Upload any files from your computer
                </p>
              </>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {file.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={file.file.name}>
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.file.size >= 1048576 
                        ? `${(file.file.size / 1048576).toFixed(1)} MB` 
                        : `${(file.file.size / 1024).toFixed(1)} KB`}
                    </p>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-1 h-1" />
                    )}
                    {file.status === 'completed' && (
                      <p className="text-xs text-green-600 font-medium mt-1">Completed</p>
                    )}
                    {file.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                  {file.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={uploadFiles} 
              disabled={files.length === 0 || uploading || files.every(f => f.status !== 'pending')}
            >
              {uploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} file(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
