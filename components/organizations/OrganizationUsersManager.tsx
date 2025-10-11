'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { grafanaAPI } from '@/lib/api/grafana';
import type { Organization, GrafanaUser } from '@/types/grafana';

interface OrganizationUsersManagerProps {
  organization: Organization;
  onBack: () => void;
}

export function OrganizationUsersManager({ organization, onBack }: OrganizationUsersManagerProps) {
  const [users, setUsers] = useState<GrafanaUser[]>([]);
  const [allUsers, setAllUsers] = useState<GrafanaUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('Viewer');

  const fetchOrgUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await grafanaAPI.getOrganizationUsers(organization.id);
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch organization users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [organization.id]);

  const fetchAllUsers = async () => {
    try {
      const data = await grafanaAPI.listUsers();
      setAllUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchOrgUsers();
    fetchAllUsers();
  }, [fetchOrgUsers]);

  const handleAddUser = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      setLoading(true);
      await grafanaAPI.addUserToOrganization(organization.id, {
        loginOrEmail: allUsers.find(u => u.id === parseInt(selectedUserId))?.login || '',
        role: selectedRole,
      });
      toast.success('User added successfully');
      setIsAddDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('Viewer');
      await fetchOrgUsers();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err?.response?.data?.message || 'Failed to add user');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    try {
      setLoading(true);
      await grafanaAPI.removeUserFromOrganization(organization.id, userId);
      toast.success('User removed successfully');
      await fetchOrgUsers();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err?.response?.data?.message || 'Failed to remove user');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out users who are already in the organization
  const availableUsers = allUsers.filter(
    (user) => !users.some((orgUser) => orgUser.id === user.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Organization Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage users in &quot;{organization.name}&quot;
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users ({users.length})</CardTitle>
              <CardDescription>
                Users who are part of this organization
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add User
              <UserPlus className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users in this organization. Add users to get started.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.login}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={loading}
                          title="Remove user"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to Organization</DialogTitle>
            <DialogDescription>
              Select a user to add to &quot;{organization.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full h-11 border-input rounded-lg focus:ring-2 focus:ring-ring">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No available users</div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full h-11 border-input rounded-lg focus:ring-2 focus:ring-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setSelectedUserId('');
                setSelectedRole('Viewer');
              }}
              disabled={loading}
              className="h-11 px-6 border-input hover:bg-accent rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!selectedUserId || loading}
              className="h-11 px-6 font-medium rounded-lg"
            >
              {loading ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
