import { FileX, Search, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'no-files' | 'no-results' | 'error';
  searchQuery?: string;
  onClearSearch?: () => void;
  onUpload?: () => void;
}

export function EmptyState({ type, searchQuery, onClearSearch, onUpload }: EmptyStateProps) {
  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4" data-testid="empty-state-no-results">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted/50 mb-6">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No files found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          We couldn't find any files matching "<span className="font-medium">{searchQuery}</span>"
        </p>
        {onClearSearch && (
          <Button variant="outline" onClick={onClearSearch} data-testid="button-clear-search">
            Clear search
          </Button>
        )}
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4" data-testid="empty-state-error">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 mb-6">
          <FileX className="h-12 w-12 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Failed to load files</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          There was an error loading your files. Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4" data-testid="empty-state-no-files">
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
        <FolderOpen className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No files yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        Get started by uploading your first file. You can drag and drop files or click the upload zone above.
      </p>
      {onUpload && (
        <Button onClick={onUpload} data-testid="button-upload-first">
          Upload your first file
        </Button>
      )}
    </div>
  );
}
