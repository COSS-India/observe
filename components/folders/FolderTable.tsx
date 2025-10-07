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
import { Pencil, Trash2, Users, Layout } from 'lucide-react';
import type { DashboardFolder } from '@/types/grafana';

interface FolderTableProps {
  folders: DashboardFolder[];
  onEdit?: (folder: DashboardFolder) => void;
  onDelete?: (folder: DashboardFolder) => void;
  onManageTeams?: (folder: DashboardFolder) => void;
  onManageDashboards?: (folder: DashboardFolder) => void;
}

export function FolderTable({ 
  folders, 
  onEdit, 
  onDelete, 
  onManageTeams, 
  onManageDashboards 
}: FolderTableProps) {
  if (folders.length === 0) {
    return (
      <div className="table-empty">
        <Layout className="table-empty-icon" />
        <h3 className="table-empty-title">No folders found</h3>
        <p className="table-empty-description">Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <Table>
        <TableHeader className="table-header">
          <TableRow>
            <TableHead className="table-cell table-cell-text col-flex">Title</TableHead>
            <TableHead className="table-cell table-cell-text col-medium table-hide-tablet">UID</TableHead>
            <TableHead className="table-cell table-cell-text col-wide table-hide-mobile">URL</TableHead>
            <TableHead className="table-cell table-cell-action col-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="table-body">
          {folders.map((folder) => (
            <TableRow key={folder.uid} className="table-row">
              <TableCell className="table-cell table-cell-text font-medium truncate">{folder.title}</TableCell>
              <TableCell className="table-cell table-cell-text font-mono text-muted-foreground table-hide-tablet">{folder.uid}</TableCell>
              <TableCell className="table-cell table-cell-text text-muted-foreground truncate table-hide-mobile">{folder.url || '-'}</TableCell>
              <TableCell className="table-cell table-cell-action">
                {(onEdit || onDelete || onManageTeams || onManageDashboards) && (
                  <div className="flex gap-2">
                    {onManageTeams && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onManageTeams(folder)}
                        title="Manage Team Access"
                        className="btn-action btn-action-edit"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    )}
                    {onManageDashboards && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onManageDashboards(folder)}
                        title="Manage Dashboards"
                        className="btn-action"
                      >
                        <Layout className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(folder)}
                        title="Edit Folder"
                        className="btn-action btn-action-edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(folder)}
                        title="Delete Folder"
                        className="btn-action btn-action-delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
