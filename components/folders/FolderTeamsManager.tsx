'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2, Users } from 'lucide-react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { DashboardFolder, Team, Permission } from '@/types/grafana';
import { toast } from 'sonner';

interface FolderTeamsManagerProps {
  folder: DashboardFolder;
  onBack: () => void;
}

export function FolderTeamsManager({ folder, onBack }: FolderTeamsManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<'1' | '2' | '4'>('1');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder.uid]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsData, permsData] = await Promise.all([
        grafanaAPI.listTeams(),
        grafanaAPI.getFolderPermissions(folder.uid),
      ]);
      setTeams(teamsData);
      setPermissions(permsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load folder teams');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!selectedTeamId) {
      toast.error('Please select a team');
      return;
    }

    setAdding(true);
    try {
      const teamId = parseInt(selectedTeamId);
      const permission = parseInt(selectedPermission) as 1 | 2 | 4;

      // Get existing permissions (filter out team permissions to rebuild)
      const existingPermissions = permissions
        .filter((p) => !p.teamId)
        .map((p) => ({
          userId: p.userId,
          role: p.role,
          permission: p.permission,
        }));

      // Get all current team permissions and add/update the selected one
      const teamPermissions = permissions
        .filter((p) => p.teamId && p.teamId !== teamId)
        .map((p) => ({
          teamId: p.teamId!,
          permission: p.permission,
        }));

      teamPermissions.push({
        teamId,
        permission,
      });

      await grafanaAPI.updateFolderPermissions(folder.uid, {
        items: [...existingPermissions, ...teamPermissions],
      });

      toast.success('Team access granted');
      setSelectedTeamId('');
      setSelectedPermission('1');
      await fetchData();
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error('Failed to grant team access');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTeam = async (teamId: number) => {
    try {
      // Get existing permissions excluding the team to remove
      const updatedPermissions = permissions
        .filter((p) => p.teamId !== teamId)
        .map((p) => ({
          teamId: p.teamId,
          userId: p.userId,
          role: p.role,
          permission: p.permission,
        }));

      await grafanaAPI.updateFolderPermissions(folder.uid, {
        items: updatedPermissions,
      });

      toast.success('Team access removed');
      await fetchData();
    } catch (error) {
      console.error('Error removing team:', error);
      toast.error('Failed to remove team access');
    }
  };

  const teamPermissions = permissions.filter((p) => p.teamId);
  const availableTeams = teams.filter(
    (team) => !teamPermissions.some((p) => p.teamId === team.id)
  );

  const getPermissionLabel = (permission: number) => {
    switch (permission) {
      case 1:
        return 'View';
      case 2:
        return 'Edit';
      case 4:
        return 'Admin';
      default:
        return 'Unknown';
    }
  };

  const getPermissionBadgeVariant = (permission: number): "default" | "secondary" | "destructive" => {
    switch (permission) {
      case 1:
        return 'secondary';
      case 2:
        return 'default';
      case 4:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack}>
            ← Back to Folders
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Access for &quot;{folder.title}&quot;
          </CardTitle>
          <CardDescription>
            Manage which teams can access this folder and its dashboards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Team Section */}
          <div className="flex gap-4">
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name} ({team.memberCount} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPermission} onValueChange={(v) => setSelectedPermission(v as '1' | '2' | '4')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">View</SelectItem>
                <SelectItem value="2">Edit</SelectItem>
                <SelectItem value="4">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAddTeam} disabled={adding || !selectedTeamId}>
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </>
              )}
            </Button>
          </div>

          {/* Current Team Permissions */}
          <div>
            <h3 className="text-sm font-medium mb-3">Current Team Access</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : teamPermissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No teams have access to this folder yet
              </div>
            ) : (
              <div className="space-y-2">
                {teamPermissions.map((perm) => {
                  const team = teams.find((t) => t.id === perm.teamId);
                  return (
                    <div
                      key={perm.teamId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {team?.name || perm.team || `Team #${perm.teamId}`}
                          </div>
                          {team && (
                            <div className="text-sm text-muted-foreground">
                              {team.memberCount} members
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPermissionBadgeVariant(perm.permission)}>
                          {getPermissionLabel(perm.permission)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTeam(perm.teamId!)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
