import { MoreVertical, Download, Copy, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { formatFileSize, formatDate, getFileTypeInfo } from '@/lib/fileUtils';
import type { S3File } from '@shared/schema';
import { cn } from '@/lib/utils';

interface FileCardProps {
  file: S3File;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  onToggleSelect?: (fileId: string) => void;
  onDownload?: (file: S3File) => void;
  onCopy?: (file: S3File) => void;
  onShare?: (file: S3File) => void;
  onDelete?: (file: S3File) => void;
}

export function FileCard({
  file,
  viewMode,
  isSelected = false,
  onToggleSelect,
  onDownload,
  onCopy,
  onShare,
  onDelete,
}: FileCardProps) {
  const fileTypeInfo = getFileTypeInfo(file.name, file.mimeType);
  const Icon = fileTypeInfo.icon;

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 px-4 h-16 rounded-lg border border-transparent',
          'hover-elevate transition-all',
          isSelected && 'bg-primary/5 border-primary/20'
        )}
        data-testid={`file-item-${file.key}`}
      >
        {onToggleSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(file.id || file.key)}
            data-testid={`checkbox-${file.key}`}
          />
        )}
        
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', fileTypeInfo.bgColor)}>
          <Icon className={cn('h-5 w-5', fileTypeInfo.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm font-medium truncate" data-testid={`file-name-${file.key}`}>
                {file.name}
              </p>
            </TooltipTrigger>
            <TooltipContent>{file.name}</TooltipContent>
          </Tooltip>
        </div>
        
        <p className="text-xs text-muted-foreground w-20 text-right font-mono" data-testid={`file-size-${file.key}`}>
          {formatFileSize(file.size)}
        </p>
        
        <p className="text-xs text-muted-foreground w-32 text-right" data-testid={`file-date-${file.key}`}>
          {formatDate(file.lastModified)}
        </p>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`actions-${file.key}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDownload && (
              <DropdownMenuItem onClick={() => onDownload(file)} data-testid={`download-${file.key}`}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            {onCopy && (
              <DropdownMenuItem onClick={() => onCopy(file)} data-testid={`copy-${file.key}`}>
                <Copy className="h-4 w-4 mr-2" />
                Make a copy
              </DropdownMenuItem>
            )}
            {onShare && (
              <DropdownMenuItem onClick={() => onShare(file)} data-testid={`share-${file.key}`}>
                <Share2 className="h-4 w-4 mr-2" />
                Share link
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(file)}
                  className="text-destructive focus:text-destructive"
                  data-testid={`delete-${file.key}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative group rounded-lg border bg-card hover-elevate transition-all p-4',
        'flex flex-col items-center gap-3',
        isSelected && 'bg-primary/5 border-primary/20'
      )}
      data-testid={`file-card-${file.key}`}
    >
      {onToggleSelect && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(file.id || file.key)}
            data-testid={`checkbox-${file.key}`}
          />
        </div>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`actions-${file.key}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onDownload && (
            <DropdownMenuItem onClick={() => onDownload(file)} data-testid={`download-${file.key}`}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
          )}
          {onCopy && (
            <DropdownMenuItem onClick={() => onCopy(file)} data-testid={`copy-${file.key}`}>
              <Copy className="h-4 w-4 mr-2" />
              Make a copy
            </DropdownMenuItem>
          )}
          {onShare && (
            <DropdownMenuItem onClick={() => onShare(file)} data-testid={`share-${file.key}`}>
              <Share2 className="h-4 w-4 mr-2" />
              Share link
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete && onDelete(file)}
                className="text-destructive focus:text-destructive"
                data-testid={`delete-${file.key}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className={cn('w-16 h-16 rounded-lg flex items-center justify-center', fileTypeInfo.bgColor)}>
        <Icon className={cn('h-8 w-8', fileTypeInfo.color)} />
      </div>
      
      <div className="w-full text-center space-y-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm font-medium truncate px-2" data-testid={`file-name-${file.key}`}>
              {file.name}
            </p>
          </TooltipTrigger>
          <TooltipContent>{file.name}</TooltipContent>
        </Tooltip>
        
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono" data-testid={`file-size-${file.key}`}>
            {formatFileSize(file.size)}
          </span>
          <span>•</span>
          <span data-testid={`file-date-${file.key}`}>{formatDate(file.lastModified)}</span>
        </div>
      </div>
    </div>
  );
}
