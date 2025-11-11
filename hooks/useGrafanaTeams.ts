import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { Team } from '@/types/grafana';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9010';

export function useGrafanaTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await grafanaAPI.listTeams();
      console.log('Fetched teams data:', data);
      // Handle both array response and object with teams property
      const teamsArray = Array.isArray(data) ? data : (data as { teams?: Team[] }).teams || [];
      console.log('Teams array:', teamsArray);
      setTeams(teamsArray);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch teams';
      setError(errorMessage);
      
      // Show helpful toast for permission errors
      if (error?.response?.status === 403) {
        toast.error('Permission Error', {
          description: error?.response?.data?.hint || 'Your Grafana API key lacks the required permissions to list teams.',
        });
      } else {
        toast.error('Error', {
          description: errorMessage,
        });
      }
      
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTeam = useCallback(async (id: number) => {
    try {
      await grafanaAPI.deleteTeam(id);
      toast.success('Team deleted successfully');
      // Refresh the list
      await fetchTeams();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete team';
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error deleting team:', err);
      throw err;
    }
  }, [fetchTeams]);

  const createTeam = useCallback(async (teamData: { name: string; email?: string; organizationId?: string }) => {
    try {
      // Step 1: Create team in Grafana
      console.log('🔄 Creating team in Grafana:', teamData.name);
      const grafanaResponse = await grafanaAPI.createTeam({
        name: teamData.name,
        email: teamData.email,
      });

      const grafanaTeamId = grafanaResponse.teamId;
      console.log('✅ Team created in Grafana with ID:', grafanaTeamId);

      // Step 2: Store team in backend with organization mapping (if organizationId provided)
      if (teamData.organizationId) {
        try {
          console.log('🔄 Storing team in backend with organization mapping...');
          await axios.post(`${BACKEND_URL}/v1/teams`, {
            team_name: teamData.name,
            email: teamData.email || null,
            grafana_team_id: grafanaTeamId,
            organization_id: parseInt(teamData.organizationId),
          });
          console.log('✅ Team stored in backend successfully');
          toast.success('Team created and mapped to organization');
        } catch (backendError) {
          console.error('❌ Failed to store team in backend:', backendError);
          // Show warning but don't fail the operation
          toast.warning('Team created in Grafana but failed to map to organization in backend');
        }
      } else {
        toast.success('Team created successfully');
      }

      await fetchTeams();
      return grafanaResponse;
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to create team';
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error creating team:', err);
      throw err;
    }
  }, [fetchTeams]);

  const updateTeam = useCallback(async (id: number, teamData: { name?: string; email?: string }) => {
    try {
      await grafanaAPI.updateTeam(id, teamData);
      toast.success('Team updated successfully');
      await fetchTeams();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to update team';
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error updating team:', err);
      throw err;
    }
  }, [fetchTeams]);

  return {
    teams,
    loading,
    error,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
}
