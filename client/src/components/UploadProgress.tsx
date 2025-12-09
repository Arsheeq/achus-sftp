import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadProgressProps {
  uploads: UploadItem[];
  onDismiss?: (id: string) => void;
}

export function UploadProgress({ uploads, onDismiss }: UploadProgressProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-2" data-testid="upload-progress">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="bg-card border border-card-border rounded-lg shadow-lg p-4 space-y-3"
          data-testid={`upload-item-${upload.id}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {upload.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                )}
                {upload.status === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
                {upload.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                )}
                <p className="text-sm font-medium truncate" title={upload.name}>
                  {upload.name}
                </p>
              </div>
              
              {upload.status === 'uploading' && (
                <div className="space-y-1">
                  <Progress value={upload.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{upload.progress}%</p>
                </div>
              )}
              
              {upload.status === 'success' && (
                <p className="text-xs text-green-600">Upload complete</p>
              )}
              
              {upload.status === 'error' && (
                <p className="text-xs text-destructive">{upload.error || 'Upload failed'}</p>
              )}
            </div>
            
            {onDismiss && upload.status !== 'uploading' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => onDismiss(upload.id)}
                data-testid={`dismiss-upload-${upload.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
