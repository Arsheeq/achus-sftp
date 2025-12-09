import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { api, type FileItem, type User } from '../api/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Upload, 
  FolderPlus, 
  LogOut, 
  Settings, 
  File, 
  Download,
  Trash2,
  Copy,
  Share2,
  Users,
  Folder,
  ChevronRight,
  Home,
  Search,
  X,
  Grid3x3,
  List
} from 'lucide-react';
import { FileUploadDialog } from '../components/FileUploadDialog';
import { ShareLinkDialog } from '../components/ShareLinkDialog';
import { useToast } from '../hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header'; // Assuming Header component is in ../components/Header

export function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareFileId, setShareFileId] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [folderAccess, setFolderAccess] = useState<{ folders: any[]; is_admin: boolean; has_full_access: boolean } | null>(null);

  const loadData = async (retryCount = 0) => {
    try {
      const [userData, filesData, folderAccessData] = await Promise.all([
        api.getCurrentUser(),
        api.getFiles(currentFolder),
        api.getMyFolderAssignments(),
      ]);
      setUser(userData);
      setFiles(filesData);
      setFolderAccess(folderAccessData);
      setLoading(false);
      return userData;
    } catch (error) {
      console.error('Error loading data:', error);

      const errorMessage = error instanceof Error ? error.message : '';
      const isJsonError = errorMessage.includes('Unexpected token') || 
                         errorMessage.includes('is not valid JSON');

      if (retryCount < 2 && (
          errorMessage.includes('Network error') || 
          errorMessage.includes('Failed to fetch') ||
          isJsonError
      )) {
        console.log(`Retrying... (attempt ${retryCount + 1})`);
        setTimeout(() => loadData(retryCount + 1), 1500);
        return null;
      }

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        toast({
          title: 'Session Expired',
          description: 'Please login again.',
          variant: 'destructive',
        });
        setLocation('/login');
      } else if (isJsonError) {
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to the API. Please try refreshing the page.',
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        toast({
          title: 'Error',
          description: errorMessage || 'Failed to load data.',
          variant: 'destructive',
        });
        setLoading(false);
      }
      return null;
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFolder]);

  const handleLogout = () => {
    api.logout();
    setLocation('/login');
  };

  const handleDownload = async (file: FileItem) => {
    try {
      let download_url: string;

      if (file.id !== null) {
        const result = await api.getDownloadUrl(file.id);
        download_url = result.download_url;
      } else {
        const result = await api.getDownloadUrlByKey(file.s3_key);
        download_url = result.download_url;
      }

      window.open(download_url, '_blank');
      toast({
        title: 'Success',
        description: 'File download started',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (file: any) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      if (file.id !== null) {
        await api.deleteFile(file.id);
      } else {
        await api.deleteFileByKey(file.s3_key);
      }
      setFiles(files.filter(f => f.s3_key !== file.s3_key));
      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Delete ${selectedFiles.size} file(s)?`)) return;

    try {
      await api.bulkDeleteFiles(Array.from(selectedFiles));
      setFiles(files.filter(f => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
      toast({
        title: 'Success',
        description: `Deleted ${selectedFiles.size} file(s)`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete files',
        variant: 'destructive',
      });
    }
  };

  const handleShare = (fileId: number) => {
    setShareFileId(fileId);
    setShareDialogOpen(true);
  };

  const handleFolderClick = (folderPath: string) => {
    setCurrentFolder(folderPath);
    setSelectedFiles(new Set());
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await api.createFolder(newFolderName, currentFolder);
      setNewFolderName('');
      setCreateFolderDialogOpen(false);
      await loadData();
      toast({
        title: 'Success',
        description: `Folder "${newFolderName}" created successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

  const getBreadcrumbs = () => {
    const parts = currentFolder.split('/').filter(p => p);
    const breadcrumbs = [{ name: 'Root', path: '/' }];
    let path = '';

    for (const part of parts) {
      path += `/${part}`;
      breadcrumbs.push({ name: part, path });
    }

    return breadcrumbs;
  };

  const hasRoleWrite = user?.roles?.some(r => r.can_write) ?? false;
  const hasRoleDelete = user?.roles?.some(r => r.can_delete) ?? false;
  const hasRoleShare = user?.roles?.some(r => r.can_share) ?? false;
  const hasRoleRead = user?.roles?.some(r => r.can_read) ?? false;
  const userFolders = folderAccess?.folders ?? [];
  const hasFolderWrite = userFolders.some(f => f.can_write);
  const hasFolderDelete = userFolders.some(f => f.can_delete);
  const hasFolderShare = userFolders.some(f => f.can_share);
  
  const canWrite = user?.is_admin || hasRoleWrite || hasFolderWrite;
  const canDelete = user?.is_admin || hasRoleDelete || hasFolderDelete;
  const canShare = user?.is_admin || hasRoleShare || hasFolderShare;

  const hasNoAccess = !user?.is_admin && 
    !hasRoleRead && 
    userFolders.length === 0 &&
    !folderAccess?.has_full_access;

  // Filter files based on search query
  const filteredFiles = files.filter(item => 
    item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('User permissions:', { 
    user: user?.username, 
    isAdmin: user?.is_admin, 
    roles: user?.roles,
    folderAccess,
    canWrite, 
    canDelete, 
    canShare,
    hasNoAccess
  });

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-8rem)]">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-3 sm:mb-4 flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
          {getBreadcrumbs().map((crumb, index, array) => (
            <div key={crumb.path} className="flex items-center flex-shrink-0">
              <button
                onClick={() => handleFolderClick(crumb.path)}
                className="hover:text-blue-600 flex items-center"
              >
                {index === 0 ? <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : null}
                <span className="whitespace-nowrap">{crumb.name}</span>
              </button>
              {index < array.length - 1 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mx-1 sm:mx-2" />}
            </div>
          ))}
        </div>

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">My Files</h2>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 dark:bg-gray-900 dark:border-gray-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1 w-fit">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-1 sm:gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden xs:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1 sm:gap-2"
            >
              <List className="w-4 h-4" />
              <span className="hidden xs:inline">List</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                setLoading(true);
                await loadData();
              }}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </Button>
            {canWrite && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCreateFolderDialogOpen(true)}
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">New Folder</span>
              </Button>
            )}
            {selectedFiles.size > 0 && canDelete && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4" />
                <span className="ml-2">Delete ({selectedFiles.size})</span>
              </Button>
            )}
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              disabled={!canWrite}
              title={!canWrite ? "You don't have upload permissions. Contact an administrator." : "Upload files to your storage"}
              size="sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Upload</span>
            </Button>
          </div>
        </div>

        {hasNoAccess && currentFolder === '/' ? (
          <Card className="p-12 text-center dark:bg-gray-900 dark:border-gray-800">
            <Folder className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No folders assigned</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have access to any folders yet. Please contact your administrator to request access.
            </p>
          </Card>
        ) : filteredFiles.length === 0 && searchQuery ? (
          <Card className="p-12 text-center dark:bg-gray-900 dark:border-gray-800">
            <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No files found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No files or folders match "{searchQuery}"</p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </Card>
        ) : files.length === 0 ? (
          <Card className="p-12 text-center dark:bg-gray-900 dark:border-gray-800">
            <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No files yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Upload your first file to get started</p>
            {canWrite && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((item) => (
              <Card 
                key={item.s3_key || item.filename} 
                className={`p-4 dark:bg-gray-900 dark:border-gray-800 ${item.type === 'folder' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                onClick={() => item.type === 'folder' ? handleFolderClick(item.folder_path) : null}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {item.type === 'file' && item.id !== null && (
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSelected = new Set(selectedFiles);
                          if (e.target.checked) {
                            newSelected.add(item.id);
                          } else {
                            newSelected.delete(item.id);
                          }
                          setSelectedFiles(newSelected);
                        }}
                        className="mr-3"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {item.type === 'folder' ? (
                      <Folder className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <File className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  {item.type === 'file' && item.id === null && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">External</span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate mb-1">{item.filename}</h3>
                {item.type === 'file' ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                      {' • '}
                      {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : 'Unknown date'}
                      {item.owner_username && (
                        <>
                          {' • '}
                          <span className="text-gray-600 dark:text-gray-400">{item.owner_username}</span>
                        </>
                      )}
                    </p>
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(item)}>
                        <Download className="w-3 h-3" />
                      </Button>
                      {canShare && item.id !== null && (
                        <Button size="sm" variant="outline" onClick={() => handleShare(item.id)}>
                          <Share2 className="w-3 h-3" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Folder</p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((item) => (
              <Card 
                key={item.s3_key || item.filename} 
                className={`p-4 dark:bg-gray-900 dark:border-gray-800 ${item.type === 'folder' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                onClick={() => item.type === 'folder' ? handleFolderClick(item.folder_path) : null}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3">
                      {item.type === 'file' && item.id !== null && (
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(item.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newSelected = new Set(selectedFiles);
                            if (e.target.checked) {
                              newSelected.add(item.id);
                            } else {
                              newSelected.delete(item.id);
                            }
                            setSelectedFiles(newSelected);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {item.type === 'folder' ? (
                        <Folder className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <File className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.filename}</h3>
                      {item.type === 'file' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                          {' • '}
                          {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : 'Unknown date'}
                          {item.owner_username && (
                            <>
                              {' • '}
                              <span className="text-gray-600 dark:text-gray-400">{item.owner_username}</span>
                            </>
                          )}
                        </p>
                      )}
                      {item.type === 'folder' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Folder</p>
                      )}
                    </div>
                    {item.type === 'file' && item.id === null && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">External</span>
                    )}
                  </div>
                  {item.type === 'file' && (
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(item)}>
                        <Download className="w-3 h-3" />
                      </Button>
                      {canShare && item.id !== null && (
                        <Button size="sm" variant="outline" onClick={() => handleShare(item.id)}>
                          <Share2 className="w-3 h-3" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FileUploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
        currentFolder={currentFolder}
        onSuccess={() => {
          loadData();
          setUploadDialogOpen(false);
        }}
      />

      {shareFileId && (
        <ShareLinkDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          fileId={shareFileId}
        />
      )}

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder in {currentFolder}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}