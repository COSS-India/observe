import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { Team } from '@/types/grafana';
import { toast } from 'sonner';
import { useOrgContextStore } from '@/lib/store/orgContextStore';
import { useAuth } from './useAuth';
import { isSuperAdmin } from '@/lib/utils/permissions';

export function useGrafanaTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedOrgId } = useOrgContextStore();
  const { user } = useAuth();
  const isUserSuperAdmin = isSuperAdmin(user);

  const fetchTeams = useCallback(async (orgId?: number | null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await grafanaAPI.listTeams(orgId);
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
      // Refresh the list with current org context
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      await fetchTeams(effectiveOrgId);
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
  }, [fetchTeams, isUserSuperAdmin, selectedOrgId]);

  const createTeam = useCallback(async (teamData: { name: string; email?: string }) => {
    try {
      // Pass orgId if user is super admin and has an org selected
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      const response = await grafanaAPI.createTeam(teamData, effectiveOrgId);
      toast.success('Team created successfully');
      // Refresh with the same org context
      await fetchTeams(effectiveOrgId);
      return response;
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
  }, [fetchTeams, isUserSuperAdmin, selectedOrgId]);

  const updateTeam = useCallback(async (id: number, teamData: { name?: string; email?: string }) => {
    try {
      // Pass orgId if user is super admin and has an org selected
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      await grafanaAPI.updateTeam(id, teamData, effectiveOrgId);
      toast.success('Team updated successfully');
      // Refresh with the same org context
      await fetchTeams(effectiveOrgId);
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
  }, [fetchTeams, isUserSuperAdmin, selectedOrgId]);

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
