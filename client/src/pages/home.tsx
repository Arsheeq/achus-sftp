import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Grid3x3, List, Search, RefreshCw, Trash2, FolderPlus } from 'lucide-react';
import { FileUploadZone } from '@/components/FileUploadZone';
import { FileCard } from '@/components/FileCard';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { CopyFileDialog } from '@/components/CopyFileDialog';
import { ShareLinkDialog } from '@/components/ShareLinkDialog';
import { EmptyState } from '@/components/EmptyState';
import { UploadProgress, type UploadItem } from '@/components/UploadProgress';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { S3File, PresignedUrl, ShareLinkResponse } from '@shared/schema';
import { cn } from '@/lib/utils';
import logoUrl from '@assets/image_1761768443489.png';

export default function Home() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteFile, setDeleteFile] = useState<S3File | null>(null);
  const [copyFile, setCopyFile] = useState<S3File | null>(null);
  const [shareFile, setShareFile] = useState<S3File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: files = [], isLoading, refetch } = useQuery<S3File[]>({
    queryKey: ['/api/files'],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    const handleUnauthorized = (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
      }
    };

    if (files && 'error' in files) {
      handleUnauthorized(files.error as Error);
    }
  }, [files, toast]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter((file) => file.name.toLowerCase().includes(query));
  }, [files, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiRequest('DELETE', '/api/files', { key });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: 'File deleted',
        description: 'The file has been successfully deleted.',
      });
      setDeleteFile(null);
      setSelectedFiles(new Set());
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the file. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      return apiRequest('POST', '/api/files/bulk-delete', { keys });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: 'Files deleted',
        description: `${selectedFiles.size} file(s) have been deleted.`,
      });
      setSelectedFiles(new Set());
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'Bulk delete failed',
        description: 'Failed to delete files. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const copyMutation = useMutation({
    mutationFn: async ({ sourceKey, destinationName }: { sourceKey: string; destinationName: string }) => {
      const destinationKey = destinationName;
      return apiRequest('POST', '/api/files/copy', { sourceKey, destinationKey, destinationName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: 'File copied',
        description: 'The file has been successfully copied.',
      });
      setCopyFile(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'Copy failed',
        description: 'Failed to copy the file. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleFilesSelected = async (files: File[]) => {
    for (const file of files) {
      const uploadId = `${Date.now()}-${file.name}`;
      
      setUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          name: file.name,
          progress: 0,
          status: 'uploading',
        },
      ]);

      try {
        const fileType = file.type || 'application/octet-stream';
        
        console.log('Requesting presigned URL for:', {
          fileName: file.name,
          fileType: fileType,
          fileSize: file.size,
        });

        const presignedData = await apiRequest<PresignedUrl>('POST', '/api/upload', {
          fileName: file.name,
          fileType: fileType,
          fileSize: file.size,
        });

        console.log('Received presigned data:', presignedData);

        if (!presignedData || !presignedData.url || !presignedData.fields) {
          throw new Error('Failed to get upload URL from server');
        }

        const formData = new FormData();
        Object.entries(presignedData.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append('file', file);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === uploadId ? { ...u, progress } : u
                )
              );
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === uploadId ? { ...u, status: 'success', progress: 100 } : u
                )
              );
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload was aborted'));
          });

          xhr.open('POST', presignedData.url);
          xhr.send(formData);
        });

        await queryClient.invalidateQueries({ queryKey: ['/api/files'] });

        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        }, 3000);
      } catch (error) {
        console.error('Upload error:', error);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? {
                  ...u,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : u
          )
        );

        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        }, 5000);
      }
    }
  };

  const handleDownload = async (file: S3File) => {
    try {
      const response = await apiRequest<{ url: string }>('POST', '/api/files/download', { key: file.key });
      window.open(response.url, '_blank');
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to generate download link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = (file: S3File) => {
    setCopyFile(file);
  };

  const handleCopyConfirm = (newName: string) => {
    if (copyFile) {
      copyMutation.mutate({
        sourceKey: copyFile.key,
        destinationName: newName,
      });
    }
  };

  const handleShare = (file: S3File) => {
    setShareFile(file);
  };

  const handleGenerateShareLink = async (expiresInHours: number, maxDownloads?: number): Promise<ShareLinkResponse> => {
    if (!shareFile?.id) throw new Error('No file selected');
    
    const response = await apiRequest<ShareLinkResponse>('POST', '/api/files/share', {
      fileId: shareFile.id,
      expiresInHours,
      maxDownloads,
    });
    
    return response;
  };

  const handleDelete = (file: S3File) => {
    setDeleteFile(file);
  };

  const handleDeleteConfirm = () => {
    if (deleteFile) {
      deleteMutation.mutate(deleteFile.key);
    }
  };

  const handleToggleSelect = (fileId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id || f.key)));
    }
  };

  const handleBulkDelete = () => {
    const keys = filteredFiles
      .filter(f => selectedFiles.has(f.id || f.key))
      .map(f => f.key);
    
    if (keys.length > 0) {
      bulkDeleteMutation.mutate(keys);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="EnlitEDU" className="h-8" />
            </div>
            {user && <UserMenu user={user} />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <FileUploadZone
            onFilesSelected={handleFilesSelected}
            isUploading={uploads.some((u) => u.status === 'uploading')}
          />

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedFiles.size > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedFiles.size} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteMutation.isPending}
                      data-testid="bulk-delete"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete selected
                    </Button>
                  </>
                )}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  data-testid="button-refresh"
                >
                  <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
                
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('grid')}
                    data-testid="button-view-grid"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('list')}
                    data-testid="button-view-list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {filteredFiles.length > 0 && viewMode === 'list' && (
              <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-muted-foreground">
                <Checkbox
                  checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="select-all"
                />
                <div className="flex-1">Name</div>
                <div className="w-20 text-right">Size</div>
                <div className="w-32 text-right">Modified</div>
                <div className="w-10"></div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFiles.length === 0 ? (
              searchQuery ? (
                <EmptyState
                  type="no-results"
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery('')}
                />
              ) : (
                <EmptyState type="no-files" />
              )
            ) : (
              <div
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                    : 'space-y-2'
                )}
                data-testid="file-list"
              >
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.key}
                    file={file}
                    viewMode={viewMode}
                    isSelected={selectedFiles.has(file.id || file.key)}
                    onToggleSelect={handleToggleSelect}
                    onDownload={handleDownload}
                    onCopy={handleCopy}
                    onShare={handleShare}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        file={deleteFile}
        isOpen={!!deleteFile}
        onClose={() => setDeleteFile(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />

      <CopyFileDialog
        file={copyFile}
        isOpen={!!copyFile}
        onClose={() => setCopyFile(null)}
        onConfirm={handleCopyConfirm}
        isCopying={copyMutation.isPending}
      />

      <ShareLinkDialog
        file={shareFile}
        isOpen={!!shareFile}
        onClose={() => setShareFile(null)}
        onGenerate={handleGenerateShareLink}
      />

      <UploadProgress uploads={uploads} />
    </div>
  );
}
