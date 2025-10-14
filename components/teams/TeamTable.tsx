'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  loading?: boolean;
}

export function TeamTable({ teams, onDelete, onEdit, loading = false }: TeamTableProps) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-16 text-body text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">No teams found</h3>
        <p className="text-sm text-muted-foreground">Create your first team to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <Card key={team.id} className="card-widget hover:shadow-sm bg-card dark:bg-transparent">
          <CardHeader className="pb-3">
            {/* Header space for consistency */}
          </CardHeader>
          <CardContent className="pt-0 flex flex-col justify-between min-h-[200px]">
            <div>
              <div className="text-l font-bold text-foreground mb-1 line-clamp-2">
                {team.name}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Email : {team.email || '-'}
              </div>
            </div>
            <div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  className="flex-1 h-10 text-white rounded-lg bg-primary hover:bg-primary/90"
                  onClick={() => onEdit(team)}
                  disabled={loading}
                  title="Edit Team"
                >
                  <Pencil className="h-4 w-4 mr-2 text-white" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 px-4 border-border hover:bg-accent text-red-600 hover:text-red-700 rounded-lg"
                      disabled={loading}
                      title="Delete Team"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
