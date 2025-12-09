import { type LucideIcon, FileText, Image, Video, Music, Archive, File, Folder } from 'lucide-react';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  // Less than 1 minute
  if (diff < 60 * 1000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than 1 day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Format as date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface FileTypeInfo {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export function getFileTypeInfo(fileName: string, mimeType?: string): FileTypeInfo {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Check mime type first
  if (mimeType) {
    if (mimeType.startsWith('image/')) {
      return { icon: Image, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950' };
    }
    if (mimeType.startsWith('video/')) {
      return { icon: Video, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' };
    }
    if (mimeType.startsWith('audio/')) {
      return { icon: Music, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950' };
    }
  }
  
  // Document types
  const documentExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'];
  if (documentExts.includes(ext)) {
    return { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' };
  }
  
  // Image types
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'];
  if (imageExts.includes(ext)) {
    return { icon: Image, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950' };
  }
  
  // Video types
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
  if (videoExts.includes(ext)) {
    return { icon: Video, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' };
  }
  
  // Audio types
  const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'];
  if (audioExts.includes(ext)) {
    return { icon: Music, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950' };
  }
  
  // Archive types
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
  if (archiveExts.includes(ext)) {
    return { icon: Archive, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-950' };
  }
  
  // Default
  return { icon: File, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-950' };
}

export function getFolderIcon(): FileTypeInfo {
  return { icon: Folder, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950' };
}

export function sanitizeFileName(fileName: string): string {
  // Remove special characters and replace spaces
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(fileName: string, mimeType?: string): boolean {
  if (mimeType && mimeType.startsWith('image/')) return true;
  const ext = getFileExtension(fileName);
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
  return imageExts.includes(ext);
}
