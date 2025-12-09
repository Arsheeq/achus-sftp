import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { api, type User, type Role } from '../api/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, UserPlus, Shield, Trash2, Edit, FolderPlus, Folder } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Layout } from '../components/Layout';

interface FolderAssignment {
  id: number;
  folder_path: string;
  user_id: number;
  username: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  assigned_at?: string;
}

export function AdminPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [folderAssignments, setFolderAssignments] = useState<FolderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [assignFolderOpen, setAssignFolderOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '', isAdmin: false, roleIds: [] as number[] });
  const [editUser, setEditUser] = useState<{ id: number; email: string; isAdmin: boolean; roleIds: number[] } | null>(null);
  const [newAssignment, setNewAssignment] = useState({ folderPath: '', userId: 0, canRead: true, canWrite: false, canDelete: false, canShare: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, rolesData, assignmentsData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getFolderAssignments(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setFolderAssignments(assignmentsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.createUser(newUser.username, newUser.password, newUser.email || null, newUser.isAdmin, newUser.roleIds);
      setNewUser({ username: '', password: '', email: '', isAdmin: false, roleIds: [] });
      setCreateUserOpen(false);
      loadData();
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditUser({
      id: user.id,
      email: user.email || '',
      isAdmin: user.is_admin,
      roleIds: user.roles.map(r => r.id),
    });
    setEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;

    try {
      await api.updateUser(editUser.id, {
        email: editUser.email || undefined,
        is_admin: editUser.isAdmin,
        role_ids: editUser.roleIds,
      });
      setEditUser(null);
      setEditUserOpen(false);
      loadData();
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.deleteUser(userId);
      loadData();
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleAssignFolder = async () => {
    if (!newAssignment.folderPath || !newAssignment.userId) {
      toast({
        title: 'Error',
        description: 'Please select a folder path and user',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.assignFolder({
        folder_path: newAssignment.folderPath,
        user_id: newAssignment.userId,
        can_read: newAssignment.canRead,
        can_write: newAssignment.canWrite,
        can_delete: newAssignment.canDelete,
        can_share: newAssignment.canShare,
      });
      setNewAssignment({ folderPath: '', userId: 0, canRead: true, canWrite: false, canDelete: false, canShare: false });
      setAssignFolderOpen(false);
      loadData();
      toast({
        title: 'Success',
        description: 'Folder assigned successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign folder',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to remove this folder assignment?')) return;

    try {
      await api.removeAssignment(assignmentId);
      loadData();
      toast({
        title: 'Success',
        description: 'Assignment removed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove assignment',
        variant: 'destructive',
      });
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex justify-between items-center">
            <Button variant="ghost" onClick={() => setLocation('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Files
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Admin Panel</h1>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="dark:text-gray-100">Users</CardTitle>
                  <CardDescription className="dark:text-gray-400">Manage user accounts and permissions</CardDescription>
                </div>
                <Button onClick={() => setCreateUserOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.is_admin ? 'Admin' : user.roles.map(r => r.name).join(', ') || 'No roles'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Roles & Permissions</CardTitle>
              <CardDescription className="dark:text-gray-400">Default roles and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roles.map((role) => (
                  <div key={role.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                      <p className="font-medium text-gray-900 dark:text-gray-100">{role.name}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{role.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {role.can_read && <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Read</span>}
                      {role.can_write && <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Write</span>}
                      {role.can_copy && <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">Copy</span>}
                      {role.can_delete && <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">Delete</span>}
                      {role.can_share && <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Share</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800 lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="dark:text-gray-100">Folder Assignments</CardTitle>
                  <CardDescription className="dark:text-gray-400">Assign folders to users with specific permissions</CardDescription>
                </div>
                <Button onClick={() => setAssignFolderOpen(true)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Assign Folder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {folderAssignments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No folder assignments yet</p>
                ) : (
                  folderAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{assignment.folder_path}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Assigned to: {assignment.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap gap-1">
                          {assignment.can_read && <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Read</span>}
                          {assignment.can_write && <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Write</span>}
                          {assignment.can_delete && <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">Delete</span>}
                          {assignment.can_share && <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Share</span>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Create New User</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Add a new user to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">Username</label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Enter username"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">Password</label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">Email (optional)</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-admin"
                checked={newUser.isAdmin}
                onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                className="dark:bg-gray-800"
              />
              <label htmlFor="is-admin" className="text-sm font-medium dark:text-gray-200">Administrator</label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">Roles</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border dark:border-gray-700 rounded p-2 dark:bg-gray-800">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`role-${role.id}`}
                      checked={newUser.roleIds.includes(role.id)}
                      onChange={(e) => {
                        const roleIds = e.target.checked
                          ? [...newUser.roleIds, role.id]
                          : newUser.roleIds.filter(id => id !== role.id);
                        setNewUser({ ...newUser, roleIds });
                      }}
                      className="dark:bg-gray-800"
                    />
                    <label htmlFor={`role-${role.id}`} className="text-sm dark:text-gray-200">{role.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Edit User</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Update user roles and permissions</DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-200">Email (optional)</label>
                <Input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  placeholder="Enter email"
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-admin"
                  checked={editUser.isAdmin}
                  onChange={(e) => setEditUser({ ...editUser, isAdmin: e.target.checked })}
                  className="dark:bg-gray-800"
                />
                <label htmlFor="edit-is-admin" className="text-sm font-medium dark:text-gray-200">Administrator</label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-200">Roles</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border dark:border-gray-700 rounded p-2 dark:bg-gray-800">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-role-${role.id}`}
                        checked={editUser.roleIds.includes(role.id)}
                        onChange={(e) => {
                          const roleIds = e.target.checked
                            ? [...editUser.roleIds, role.id]
                            : editUser.roleIds.filter(id => id !== role.id);
                          setEditUser({ ...editUser, roleIds });
                        }}
                        className="dark:bg-gray-800"
                      />
                      <label htmlFor={`edit-role-${role.id}`} className="text-sm dark:text-gray-200">{role.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateUser}>Update User</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={assignFolderOpen} onOpenChange={setAssignFolderOpen}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Assign Folder to User</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Give a user access to a specific folder</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">Folder Path</label>
              <Input
                value={newAssignment.folderPath}
                onChange={(e) => setNewAssignment({ ...newAssignment, folderPath: e.target.value })}
                placeholder="e.g., /documents or /projects/team-a"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Enter the folder path. Use / for root access.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">User</label>
              <select
                value={newAssignment.userId}
                onChange={(e) => setNewAssignment({ ...newAssignment, userId: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value={0}>Select a user...</option>
                {users.filter(u => !u.is_admin).map((user) => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">Permissions</label>
              <div className="space-y-2 border dark:border-gray-700 rounded p-3 dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="can-read"
                    checked={newAssignment.canRead}
                    onChange={(e) => setNewAssignment({ ...newAssignment, canRead: e.target.checked })}
                    className="dark:bg-gray-800"
                  />
                  <label htmlFor="can-read" className="text-sm dark:text-gray-200">Can Read - View files and folders</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="can-write"
                    checked={newAssignment.canWrite}
                    onChange={(e) => setNewAssignment({ ...newAssignment, canWrite: e.target.checked })}
                    className="dark:bg-gray-800"
                  />
                  <label htmlFor="can-write" className="text-sm dark:text-gray-200">Can Write - Upload files and create folders</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="can-delete"
                    checked={newAssignment.canDelete}
                    onChange={(e) => setNewAssignment({ ...newAssignment, canDelete: e.target.checked })}
                    className="dark:bg-gray-800"
                  />
                  <label htmlFor="can-delete" className="text-sm dark:text-gray-200">Can Delete - Remove files and folders</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="can-share"
                    checked={newAssignment.canShare}
                    onChange={(e) => setNewAssignment({ ...newAssignment, canShare: e.target.checked })}
                    className="dark:bg-gray-800"
                  />
                  <label htmlFor="can-share" className="text-sm dark:text-gray-200">Can Share - Create share links for files</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setAssignFolderOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignFolder}>Assign Folder</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}

