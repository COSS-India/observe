'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { X, Loader2, Users, Search, FolderOpen, ArrowLeft, ChartColumn } from 'lucide-react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { DashboardFolder, Team, Permission } from '@/types/grafana';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [removingTeamId, setRemovingTeamId] = useState<number | null>(null);
  const [logoError, setLogoError] = useState(false);

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

  const confirmRemoveTeam = async () => {
    if (!removingTeamId) return;

    try {
      // Get existing permissions excluding the team to remove
      const updatedPermissions = permissions
        .filter((p) => p.teamId !== removingTeamId)
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
    } finally {
      setRemovingTeamId(null);
    }
  };

  const teamPermissions = permissions.filter((p) => p.teamId);
  const availableTeams = teams.filter(
    (team) => !teamPermissions.some((p) => p.teamId === team.id) &&
              team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTeamPermissions = teamPermissions.filter((perm) => {
    const team = teams.find((t) => t.id === perm.teamId);
    return team && team.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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

  // Get brand name and logo from environment variables
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME;
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL;
  const showBranding = brandName || logoUrl;

  return (
    <div className="w-full overflow-hidden">
      {/* Brand Logo and Name */}
      {showBranding && (
        <div className="flex items-center justify-center mb-6 p-4 border-b border-border">
          <Link href="/dashboard/my-dashboards" className="flex items-center gap-3">
            {logoUrl && !logoError ? (
              <div className="flex-shrink-0">
                <Image 
                  src={logoUrl} 
                  alt={brandName || "Logo"} 
                  width={40}
                  height={40}
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                <ChartColumn className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            {brandName && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-lg text-foreground truncate">
                  {brandName}
                </span>
              </div>
            )}
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="h-9 sm:h-10 md:!h-11 px-3 sm:px-4 md:px-6 text-xs sm:text-sm border-input hover:bg-accent rounded-lg border-0 shadow-none"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Folders
          </Button>
        </div>
      </div>

      <Card className='border-0 shadow-none dark:bg-transparent'>
        <CardHeader className="p-3 sm:p-4 md:!px-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl !px-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Team Access for &quot;{folder.title}&quot;</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage which teams can access this folder and its dashboards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-0 dark:bg-transparent">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>

          {/* Add Team Section */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:grid md:grid-cols-12 md:gap-4">
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="flex-1 h-9 sm:h-10 md:!h-11 text-xs sm:text-sm border-input rounded-lg focus:ring-2 focus:ring-ring col-span-7">
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
              <SelectTrigger className="w-full col-span-3  h-9 sm:h-10 md:!h-11 text-xs sm:text-sm border-input rounded-lg focus:ring-2 focus:ring-ring">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">View</SelectItem>
                <SelectItem value="2">Edit</SelectItem>
                <SelectItem value="4">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAddTeam} 
              disabled={adding || !selectedTeamId}
              className="h-9 sm:h-10 md:!h-11 px-4 sm:px-5 md:px-6 text-xs sm:text-sm font-medium rounded-lg w-full sm:w-auto whitespace-nowrap col-span-2"
            >
              {adding ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <>
                  {/* <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> */}
                  Add
                </>
              )}
            </Button>
          </div>

          {/* Current Team Permissions */}
          <div>
            <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Current Team Access</h3>
            {loading ? (
              <div className="flex justify-center py-6 sm:py-8">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              </div>
            ) : filteredTeamPermissions.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  No teams have access
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Add teams above to grant access to this folder"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeamPermissions.map((perm) => {
                  const team = teams.find((t) => t.id === perm.teamId);
                  return (
                    <Card key={perm.teamId} className="card-widget hover:shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="!text-xs font-medium text-muted-foreground uppercase tracking-wide flex justify-end items-center">
                          {/* CUSTOMER */}
                          <Badge 
                            variant={getPermissionBadgeVariant(perm.permission)}
                            className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1"
                          >
                            {getPermissionLabel(perm.permission)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 flex flex-col justify-between min-h-[150px]">
                        <div>
                          <div className="text-l font-bold text-foreground mb-1 line-clamp-2">
                            {team?.name || perm.team || `Team #${perm.teamId}`}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {team?.memberCount || 0} members
                          </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-10 px-4 border-border hover:bg-accent rounded-lg"
                                title="Remove team access"
                                onClick={() => setRemovingTeamId(perm.teamId!)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Team Access</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove access for this team? They will no longer be able to access this folder.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmRemoveTeam}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
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
