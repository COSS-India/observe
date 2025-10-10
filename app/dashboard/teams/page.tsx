'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { useGrafanaTeams } from '@/hooks/useGrafanaTeams';
import { TeamTable } from '@/components/teams/TeamTable';
import { TeamFormDialog } from '@/components/teams/TeamFormDialog';
import { TeamMembersManager } from '@/components/teams/TeamMembersManager';
import { Pagination } from '@/components/ui/pagination';
import type { Team } from '@/types/grafana';
import { GrafanaSetupError } from '@/components/GrafanaSetupError';

export default function TeamsPage() {
  const { teams, loading, error, fetchTeams, createTeam, updateTeam, deleteTeam } = useGrafanaTeams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [managingMembersTeam, setManagingMembersTeam] = useState<Team | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.email && team.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination logic
  const totalItems = filteredTeams.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage teams and their members
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2 md:px-6 text-xs sm:text-sm h-9 sm:h-10 md:h-11 whitespace-nowrap gap-1">
          <PlusCircle className="font-black" />
          Create Team
        </Button>
      </div>

      {error && !error.includes('configuration') && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-destructive">{error}</p>
        </div>
      )}

      <Card className=" border-gray-200 dark:border-gray-800 border-0 shadow-none">
        <CardContent className="!p-0">
          {error && teams.length === 0 && (
            <GrafanaSetupError error={error} />
          )}

          {!error && (
            <>
              <div className="mb-4 sm:mb-6">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-12 h-10 sm:h-11 md:h-12 text-xs sm:text-sm border-input rounded-lg w-full"
                  />
                </div>
              </div>

              {loading && teams.length === 0 ? (
                <div className="text-center py-12 sm:py-16 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-xs sm:text-sm">Loading teams...</p>
                </div>
              ) : (
                <>
                  <TeamTable
                    teams={paginatedTeams}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onManageMembers={handleManageMembers}
                    loading={loading}
                  />
                  {totalPages > 1 && (
                    <div className="mt-6 px-4 sm:px-6">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={totalItems}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    </div>
                  )}
                </>
              )}
            </>
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
