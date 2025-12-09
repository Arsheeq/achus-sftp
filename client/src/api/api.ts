const API_BASE_URL = '/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  is_active: boolean;
  roles: Role[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  can_read: boolean;
  can_write: boolean;
  can_copy: boolean;
  can_delete: boolean;
  can_share: boolean;
}

export interface FileItem {
  id: number | null;
  filename: string;
  s3_key: string | null;
  file_size: number | null;
  content_type: string | null;
  folder_path: string;
  uploaded_at: string | null;
  owner_username: string | null;
  type: "file" | "folder";
}

export interface UploadUrlResponse {
  file_id: number;
  upload_url: string;
  upload_fields: Record<string, string>;
  s3_key: string;
}

export interface ShareLinkResponse {
  share_token: string;
  expires_at: string;
  share_url: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('access_token');
  }

  private getHeaders(): Headers {
    this.checkTokenExpiry();

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (this.token) {
      headers.append('Authorization', `Bearer ${this.token}`);
    }

    return headers;
  }

  private decodeToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }

  async login(credentials: LoginCredentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const error = await response.json();
        errorMessage = error.detail || errorMessage;
      } catch {
        // If response is not JSON (e.g., HTML error page), use status text
        errorMessage = `Server error: ${response.statusText || 'Please try again'}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    this.token = data.access_token;
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  }

  private checkTokenExpiry(): void {
    if (this.token && this.isTokenExpired(this.token)) {
      console.warn('Token expired, clearing authentication');
      this.logout();
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/';
      }
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        // Token is invalid or expired
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error('Failed to get current user');
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  async getFiles(folderPath: string = '/'): Promise<FileItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/files?folder_path=${encodeURIComponent(folderPath)}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  async getUploadUrl(filename: string, contentType: string, folderPath: string = '/'): Promise<UploadUrlResponse> {
    const response = await fetch(`${API_BASE_URL}/files/upload-url`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ filename, content_type: contentType, folder_path: folderPath }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get upload URL');
    }

    return response.json();
  }

  async uploadFile(file: File, uploadUrl: string, uploadFields: Record<string, string>) {
    const formData = new FormData();

    Object.entries(uploadFields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    formData.append('file', file);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      // S3 returns 204 No Content on success, which is ok
      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        console.error('S3 upload error:', errorText);
        throw new Error(`Failed to upload file to S3: ${response.status}`);
      }
    } catch (error) {
      // If the error is a network error (CORS), the upload might have actually succeeded
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error during S3 upload - CORS issue, but file may have uploaded');
        // Don't throw here - let the completion step verify
        return;
      }
      throw error;
    }
  }

  async getDownloadUrl(fileId: number): Promise<{ download_url: string; filename: string }> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/download-url`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get download URL');
    }

    return response.json();
  }

  async getDownloadUrlByKey(s3Key: string): Promise<{ download_url: string; filename: string }> {
    const response = await fetch(`${API_BASE_URL}/files/download-by-key/${encodeURIComponent(s3Key)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get download URL');
    }

    return response.json();
  }

  async deleteFile(fileId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  async deleteFileByKey(s3Key: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/by-key/${encodeURIComponent(s3Key)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  async bulkDeleteFiles(fileIds: number[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/bulk-delete`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ file_ids: fileIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete files');
    }
  }

  async copyFile(fileId: number, destinationFolder: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/copy`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ destination_folder: destinationFolder }),
    });

    if (!response.ok) {
      throw new Error('Failed to copy file');
    }
  }

  async createShareLink(fileId: number, expiresInHours: number = 24): Promise<ShareLinkResponse> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/share`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ expires_in_hours: expiresInHours }),
    });

    if (!response.ok) {
      throw new Error('Failed to create share link');
    }

    return response.json();
  }

  async createFolder(folderName: string, parentFolder: string = '/'): Promise<{ message: string; folder_path: string }> {
    const response = await fetch(`${API_BASE_URL}/files/create-folder`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ folder_name: folderName, parent_folder: parentFolder }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create folder');
    }

    return response.json();
  }

  // Admin endpoints
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }

  async createUser(username: string, password: string, email: string | null, isAdmin: boolean, roleIds: number[]): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        username,
        password,
        email,
        is_admin: isAdmin,
        role_ids: roleIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create user');
    }

    return response.json();
  }

  async updateUser(userId: number, data: { email?: string; is_active?: boolean; is_admin?: boolean; role_ids?: number[] }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return response.json();
  }

  async deleteUser(userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  }

  async getRoles(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }

    return response.json();
  }

  async createRole(data: { name: string; description?: string; can_read: boolean; can_write: boolean; can_copy: boolean; can_delete: boolean; can_share: boolean }): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create role');
    }

    return response.json();
  }

  async updateRole(roleId: number, data: Partial<Role>): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update role');
    }

    return response.json();
  }

  async deleteRole(roleId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete role');
    }
  }
}

export const api = new ApiClient();