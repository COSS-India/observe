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
import { Pencil, Trash2, Building2 } from 'lucide-react';
import type { Organization } from '@/types/grafana';
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

interface OrganizationTableProps {
  organizations: Organization[];
  onDelete: (id: number) => void;
  onEdit: (org: Organization) => void;
  loading?: boolean;
}

export function OrganizationTable({ organizations, onDelete, onEdit, loading = false }: OrganizationTableProps) {
  if (organizations.length === 0) {
    return (
      <div className="table-empty">
        <Building2 className="table-empty-icon" />
        <h3 className="table-empty-title">No organizations found</h3>
        <p className="table-empty-description">Create an organization to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <Table>
        <TableHeader className="table-header">
          <TableRow>
            <TableHead className="table-cell table-cell-text col-flex">Name</TableHead>
            <TableHead className="table-cell table-cell-number col-narrow">ID</TableHead>
            <TableHead className="table-cell table-cell-action col-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="table-body">
          {organizations.map((org) => (
            <TableRow key={org.id} className="table-row">
              <TableCell className="table-cell table-cell-text font-medium">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span>{org.name}</span>
                </div>
              </TableCell>
              <TableCell className="table-cell table-cell-number text-muted-foreground">{org.id}</TableCell>
              <TableCell className="table-cell table-cell-action">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(org)}
                    disabled={loading}
                    title="Edit organization"
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
                        title="Delete organization"
                        className="btn-action btn-action-delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg">Delete Organization</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Are you sure you want to delete the organization &quot;{org.name}&quot;?
                          This action cannot be undone and will affect all users and teams in this organization.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="px-4 py-2">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(org.id)}
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
