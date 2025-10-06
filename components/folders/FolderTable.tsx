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
      <div className="text-center py-8 text-muted-foreground">
        No folders found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>UID</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {folders.map((folder) => (
            <TableRow key={folder.uid}>
              <TableCell className="font-medium">{folder.title}</TableCell>
              <TableCell className="font-mono text-sm">{folder.uid}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{folder.url || '-'}</TableCell>
              <TableCell>
                {(onEdit || onDelete || onManageTeams || onManageDashboards) && (
                  <div className="flex gap-2">
                    {onManageTeams && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onManageTeams(folder)}
                        title="Manage Team Access"
                        className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
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
                        className="hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950 dark:hover:text-purple-400"
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
                        className="hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950 dark:hover:text-amber-400"
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
                        className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
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
