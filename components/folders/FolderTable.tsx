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
import { Pencil, Trash2 } from 'lucide-react';
import type { DashboardFolder } from '@/types/grafana';

interface FolderTableProps {
  folders: DashboardFolder[];
  onEdit?: (folder: DashboardFolder) => void;
  onDelete?: (folder: DashboardFolder) => void;
}

export function FolderTable({ folders, onEdit, onDelete }: FolderTableProps) {
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
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {folders.map((folder) => (
            <TableRow key={folder.uid}>
              <TableCell className="font-medium">{folder.title}</TableCell>
              <TableCell className="font-mono text-sm">{folder.uid}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{folder.url || '-'}</TableCell>
              <TableCell>
                {(onEdit || onDelete) && (
                  <div className="flex gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(folder)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(folder)}
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
