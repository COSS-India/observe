'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Users } from 'lucide-react';
import type { Team } from '@/types/grafana';
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

interface TeamTableProps {
  teams: Team[];
  onDelete: (id: number) => void;
  onEdit: (team: Team) => void;
  onManageMembers?: (team: Team) => void;
  loading?: boolean;
}

export function TeamTable({ teams, onDelete, onEdit, onManageMembers, loading = false }: TeamTableProps) {
  if (teams.length === 0) {
    return (
      <div className="table-empty">
        <Users className="table-empty-icon" />
        <h3 className="table-empty-title">No teams found</h3>
        <p className="table-empty-description">Create your first team to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <Table>
        <TableHeader className="table-header">
          <TableRow>
            <TableHead className="table-cell table-cell-text col-flex">Group Name</TableHead>
            <TableHead className="table-cell table-cell-text col-wide">Email</TableHead>
            <TableHead className="table-cell table-cell-number col-narrow">Members</TableHead>
            <TableHead className="table-cell table-cell-action col-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="table-body">
          {teams.map((team) => (
            <TableRow key={team.id} className="table-row">
              <TableCell className="table-cell table-cell-text font-medium">{team.name}</TableCell>
              <TableCell className="table-cell table-cell-text text-muted-foreground">{team.email || '—'}</TableCell>
              <TableCell className="table-cell table-cell-number">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{team.memberCount || 0}</span>
                </div>
              </TableCell>
              <TableCell className="table-cell table-cell-action">
                <div className="flex justify-end gap-2">
                  {onManageMembers && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageMembers(team)}
                      disabled={loading}
                      title="Manage members"
                      className="h-9 px-4"
                    >
                      {/* Members */}
                      <Users className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(team)}
                    disabled={loading}
                    title="Edit team"
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
                        title="Delete team"
                        className="btn-action btn-action-delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg">Delete Team</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Are you sure you want to delete the team &quot;{team.name}&quot;?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="px-4 py-2">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(team.id)}
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
  );
}
