'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Power, PowerOff, ChevronDown, ChevronRight, Users } from 'lucide-react';
import type { GrafanaUser } from '@/types/grafana';
import { useUserTeams } from '@/hooks/useUserTeams';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserTableProps {
  users: GrafanaUser[];
  onDelete: (id: number) => void;
  onEdit: (user: GrafanaUser) => void;
  onToggleStatus: (id: number, isDisabled: boolean) => void;
  loading?: boolean;
}

function UserTeamsBadge({ userId }: { userId: number }) {
  const { teams, loading, fetchUserTeams } = useUserTeams(userId);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded && teams.length === 0 && !loading) {
      fetchUserTeams();
    }
  }, [expanded, teams.length, loading, fetchUserTeams]);

  if (loading) {
    return <Badge variant="outline">Loading...</Badge>;
  }

  if (teams.length === 0 && !expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className="h-7 px-3 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Check Teams
        <Users className="h-3 w-3 ml-1" />
      </Button>
    );
  }

  if (teams.length === 0 && expanded) {
    return <Badge variant="outline">No teams</Badge>;
  }

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {!expanded && teams.length > 0 ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className="h-7 px-3 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {teams.length} {teams.length === 1 ? 'team' : 'teams'}
        <ChevronRight className="h-3 w-3 ml-1" />
      </Button>
      ) : (
      <>
        {teams.map((team) => (
        <Badge key={team.id} variant="secondary" className="text-xs px-2 py-1 mr-1 mb-1">
          {team.name}
        </Badge>
        ))}
        <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(false)}
        className="h-7 px-3 text-xs ml-auto hover:bg-gray-100 dark:hover:bg-gray-800"
        >
        Hide
        <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </>
      )}
    </div>
  );
}

export function UserTable({ users, onDelete, onEdit, onToggleStatus, loading = false }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="table-empty">
        <Users className="table-empty-icon" />
        <h3 className="table-empty-title">No users found</h3>
        <p className="table-empty-description">Create your first user to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="table-header">
            <TableRow>
              <TableHead className="table-cell table-cell-text col-medium">Name</TableHead>
              <TableHead className="table-cell table-cell-text col-wide">Email</TableHead>
              <TableHead className="table-cell table-cell-text col-medium">Login</TableHead>
              <TableHead className="table-cell table-cell-text col-narrow">Role</TableHead>
              <TableHead className="table-cell table-cell-text col-medium">Teams</TableHead>
              <TableHead className="table-cell table-cell-status col-narrow">Status</TableHead>
              <TableHead className="table-cell table-cell-action col-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="table-body">
            {users.map((user) => (
              <TableRow key={user.id} className="table-row">
                <TableCell className="table-cell table-cell-text font-medium">{user.name}</TableCell>
                <TableCell className="table-cell table-cell-text text-muted-foreground break-all">{user.email}</TableCell>
                <TableCell className="table-cell table-cell-text text-muted-foreground">{user.login}</TableCell>
                <TableCell className="table-cell table-cell-status">
                  <Badge variant={user.role === 'Admin' ? 'default' : user.role === 'Editor' ? 'secondary' : 'outline'} className="badge badge-neutral">
                    {user.role || (user.isGrafanaAdmin ? 'Admin' : 'Viewer')}
                  </Badge>
                </TableCell>
                <TableCell className="table-cell table-cell-text">
                  <div className="flex flex-wrap gap-2 items-center min-h-[2.5rem]">
                    <UserTeamsBadge userId={user.id} />
                  </div>
                </TableCell>
                <TableCell className="table-cell table-cell-status">
                  <Badge variant={user.isDisabled ? 'destructive' : 'default'} className={`badge ${user.isDisabled ? 'badge-error' : 'badge-success'}`}>
                    {user.isDisabled ? 'Disabled' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="table-cell table-cell-action">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleStatus(user.id, user.isDisabled)}
                      disabled={loading}
                      title={user.isDisabled ? 'Enable user' : 'Disable user'}
                      className="btn-action"
                    >
                      {user.isDisabled ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(user)}
                      disabled={loading}
                      title="Edit user"
                      className="btn-action btn-action-edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={loading}
                          title="Delete user"
                          className="btn-action btn-action-delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md mx-4">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg">Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            This will permanently delete the user &quot;{user.name}&quot;. This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                          <AlertDialogCancel className="px-4 py-2">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(user.id)}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
