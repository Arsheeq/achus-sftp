export interface S3File {
  id?: string;
  name: string;
  key: string;
  size: number;
  mimeType: string;
  lastModified?: Date | string;
  url?: string;
  folderId?: string | null;
  userId?: string;
}

export interface PresignedUrl {
  url: string;
  fields?: Record<string, string>;
  key: string;
}

export interface ShareLinkResponse {
  url: string;
  token: string;
  expiresAt: Date | string;
  maxDownloads?: number | null;
}

export interface User {
  id: number | string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
  isAdmin?: boolean;
}

export interface FileMetadata {
  id: string;
  name: string;
  key: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  userId: string;
  createdAt: Date | string;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  userId: string;
  createdAt: Date | string;
}

export const uploadRequestSchema = {
  parse: (data: any) => data,
  safeParse: (data: any) => ({ success: true, data }),
};

export const copyFileSchema = {
  parse: (data: any) => data,
  safeParse: (data: any) => ({ success: true, data }),
};

export const createShareLinkSchema = {
  parse: (data: any) => data,
  safeParse: (data: any) => ({ success: true, data }),
};

export const bulkDeleteSchema = {
  parse: (data: any) => data,
  safeParse: (data: any) => ({ success: true, data }),
};
