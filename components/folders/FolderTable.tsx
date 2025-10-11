'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Users, Layout, FolderOpen } from 'lucide-react';
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
      <div className="text-center py-16 text-body text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">No folders found</h3>
        <p className="text-sm text-muted-foreground">Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {folders.map((folder) => (
        <Card key={folder.uid} className="card-widget hover:shadow-sm bg-card dark:bg-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="!text-xs font-medium text-muted-foreground uppercase tracking-wide flex justify-between items-center">
              Folder
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col justify-between min-h-[200px]">
            <div>
              <div className="text-l font-bold text-foreground mb-1 line-clamp-2">
                {folder.title}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mt-4">
                {onManageTeams && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-10 text-body border-border hover:bg-accent rounded-lg"
                    onClick={() => onManageTeams(folder)}
                    title="Manage Team Access"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Teams
                  </Button>
                )}
                {onManageDashboards && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-10 text-body border-border hover:bg-accent rounded-lg"
                    onClick={() => onManageDashboards(folder)}
                    title="Manage Dashboards"
                  >
                    <Layout className="h-4 w-4 mr-2" />
                    Dashboards
                  </Button>
                )}
              </div>
              {(onEdit || onDelete) && (
                <div className="flex gap-2 mt-3">
                  {onEdit && (
                    <Button
                      size="sm"
                      className="flex-1 h-10 text-body rounded-lg"
                      onClick={() => onEdit(folder)}
                      title="Edit Folder"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 px-4 border-border hover:bg-accent text-red-600 hover:text-red-700 rounded-lg"
                      onClick={() => onDelete(folder)}
                      title="Delete Folder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
