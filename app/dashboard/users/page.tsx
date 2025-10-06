'use client';

import { useEffect, useState } from 'react';
import { useGrafanaUsers } from '@/hooks/useGrafanaUsers';
import { UserTable } from '@/components/users/UserTable';
import { UserEditDialog } from '@/components/users/UserEditDialog';
import { GrafanaSetupError } from '@/components/GrafanaSetupError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GrafanaUser } from '@/types/grafana';

export default function UsersPage() {
  const { users, loading, error, fetchUsers, updateUser, deleteUser, toggleUserStatus } = useGrafanaUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GrafanaUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (user: GrafanaUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: { name: string; email: string; login: string; role: string }) => {
    if (selectedUser) {
      await updateUser(selectedUser.id, data);
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage Grafana users and their permissions
          </p>
        </div>
        <Link href="/dashboard/users/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users in your Grafana instance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && users.length === 0 && (
            <GrafanaSetupError error={error} />
          )}

          {!error && (
            <>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users by name, email, or login..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading && users.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Loading users...
                </div>
              ) : (
                <UserTable
                  users={filteredUsers}
                  onDelete={deleteUser}
                  onEdit={handleEdit}
                  onToggleStatus={toggleUserStatus}
                  loading={loading}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <UserEditDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        onSubmit={handleUpdate}
        user={selectedUser}
      />
    </div>
  );
}
