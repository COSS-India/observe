'use client';

import { useEffect, useState } from 'react';
import { useGrafanaUsers } from '@/hooks/useGrafanaUsers';
import { UserTable } from '@/components/users/UserTable';
import { UserEditDialog } from '@/components/users/UserEditDialog';
import { GrafanaSetupError } from '@/components/GrafanaSetupError';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { GrafanaUser } from '@/types/grafana';

export default function UsersPage() {
  const { users, loading, error, fetchUsers, updateUser, deleteUser, toggleUserStatus } = useGrafanaUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GrafanaUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1">User Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage Grafana users and their permissions
          </p>
        </div>
        <Link href="/dashboard/users/create">
          <Button className="px-4 py-2 sm:px-5 sm:py-2 md:px-6 text-xs sm:text-sm h-9 sm:h-10 md:h-11 whitespace-nowrap gap-1">
            <PlusCircle className="font-black" />
            Create User
          </Button>
        </Link>
      </div>

      <Card className=" border-gray-200 dark:border-gray-800 border-0 shadow-none">
        <CardContent className="!p-0">
          {error && users.length === 0 && (
            <GrafanaSetupError error={error} />
          )}

          {!error && (
            <>
              <div className="mb-4 sm:mb-6">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name, email, or login..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-12 h-10 sm:h-11 md:h-12 text-xs sm:text-sm border-input rounded-lg w-full"
                  />
                </div>
              </div>

              {loading && users.length === 0 ? (
                <div className="text-center py-12 sm:py-16 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-xs sm:text-sm">Loading users...</p>
                </div>
              ) : (
                <>
                  <UserTable
                    users={paginatedUsers}
                    onDelete={deleteUser}
                    onEdit={handleEdit}
                    onToggleStatus={toggleUserStatus}
                    loading={loading}
                  />
                  {totalPages > 1 && (
                    <div className="mt-6 px-4 sm:px-6">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={totalItems}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    </div>
                  )}
                </>
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
