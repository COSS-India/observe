'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useGrafanaTeams } from '@/hooks/useGrafanaTeams';
import { TeamTable } from '@/components/teams/TeamTable';
import { TeamFormDialog } from '@/components/teams/TeamFormDialog';
import { TeamMembersManager } from '@/components/teams/TeamMembersManager';
import type { Team } from '@/types/grafana';
import { GrafanaSetupError } from '@/components/GrafanaSetupError';

export default function TeamsPage() {
  const { teams, loading, error, fetchTeams, createTeam, updateTeam, deleteTeam } = useGrafanaTeams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [managingMembersTeam, setManagingMembersTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.email && team.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = async (data: { name: string; email?: string }) => {
    await createTeam(data);
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: { name: string; email?: string }) => {
    if (selectedTeam) {
      await updateTeam(selectedTeam.id, data);
      setSelectedTeam(null);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteTeam(id);
  };

  const handleManageMembers = (team: Team) => {
    setManagingMembersTeam(team);
  };

  // Show team members manager if a team is selected
  if (managingMembersTeam) {
    return (
      <TeamMembersManager
        team={managingMembersTeam}
        onBack={() => {
          setManagingMembersTeam(null);
          fetchTeams(); // Refresh to update member counts
        }}
      />
    );
  }

  // Show error component if there's a setup issue
  if (error && error.includes('configuration')) {
    return <GrafanaSetupError error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage teams and their members
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {error && !error.includes('configuration') && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Teams</CardTitle>
              <CardDescription>
                A list of all teams in your organization
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <TeamTable
              teams={filteredTeams}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onManageMembers={handleManageMembers}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      <TeamFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        title="Create Team"
        description="Add a new team to your organization"
      />

      <TeamFormDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setSelectedTeam(null);
        }}
        onSubmit={handleUpdate}
        team={selectedTeam}
        title="Edit Team"
        description="Update team details"
      />
    </div>
  );
}
