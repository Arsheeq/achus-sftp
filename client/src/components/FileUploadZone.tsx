import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  folderId?: string;
}

export function FileUploadZone({ onFilesSelected, isUploading = false }: FileUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !isUploading) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected, isUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative overflow-hidden rounded-lg border-2 border-dashed transition-all duration-200',
        'min-h-48 flex flex-col items-center justify-center gap-4 p-8',
        'hover-elevate active-elevate-2 cursor-pointer',
        isDragActive && !isUploading && 'border-primary bg-primary/5',
        !isDragActive && 'border-border',
        isUploading && 'opacity-50 cursor-not-allowed'
      )}
      data-testid="upload-zone"
    >
      <input {...getInputProps()} data-testid="file-input" />
      
      <div className="flex flex-col items-center gap-3 text-center">
        {isDragActive ? (
          <FileUp className="h-12 w-12 text-primary animate-bounce" />
        ) : (
          <Upload className="h-12 w-12 text-muted-foreground" />
        )}
        
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse your computer
          </p>
        </div>
        
        {!isDragActive && (
          <p className="text-xs text-muted-foreground max-w-md">
            Supports all file types. Multiple files can be uploaded at once.
          </p>
        )}
      </div>
    </div>
  );
}
