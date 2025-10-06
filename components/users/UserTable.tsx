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
        className="h-6 px-2 text-xs"
      >
        <Users className="h-3 w-3 mr-1" />
        Check Teams
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
        className="h-6 px-2 text-xs"
      >
        <Users className="h-3 w-3 mr-1" />
        {teams.length} {teams.length === 1 ? 'team' : 'teams'}
        <ChevronRight className="h-3 w-3 ml-1" />
      </Button>
      ) : (
      <>
        {teams.map((team) => (
        <Badge key={team.id} variant="secondary" className="text-xs">
          {team.name}
        </Badge>
        ))}
        <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(false)}
        className="h-6 px-2 text-xs ml-auto"
        >
        <ChevronDown className="h-3 w-3 mr-1" />
        Hide
        </Button>
      </>
      )}
    </div>
  );
}

export function UserTable({ users, onDelete, onEdit, onToggleStatus, loading = false }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No users found. Create your first user to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Teams</TableHead>
            <TableHead>Status</TableHead>
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
                <Badge variant={user.role === 'Admin' ? 'default' : user.role === 'Editor' ? 'secondary' : 'outline'}>
                  {user.role || (user.isGrafanaAdmin ? 'Admin' : 'Viewer')}
                </Badge>
              </TableCell>
              <TableCell className="p-0">
                <div className="flex flex-wrap gap-2 items-center min-h-[2.5rem] px-2 py-1">
                  <UserTeamsBadge userId={user.id} />
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.isDisabled ? 'destructive' : 'default'}>
                  {user.isDisabled ? 'Disabled' : 'Active'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus(user.id, user.isDisabled)}
                    disabled={loading}
                    title={user.isDisabled ? 'Enable user' : 'Disable user'}
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
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the user &quot;{user.name}&quot;. This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(user.id)}
                          className="bg-red-500 hover:bg-red-600"
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
  );
}
