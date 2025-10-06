import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { Team } from '@/types/grafana';
import { toast } from 'sonner';

export function useUserTeams(userId?: number) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTeams = useCallback(async (id?: number) => {
    const targetUserId = id || userId;
    if (!targetUserId) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await grafanaAPI.getUserTeams(targetUserId);
      console.log('Fetched user teams:', data);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch user teams';
      setError(errorMessage);
      
      // Show helpful toast for permission errors
      if (error?.response?.status === 403) {
        toast.error('Permission Error', {
          description: error?.response?.data?.hint || 'Your Grafana API key lacks the required permissions to fetch user teams.',
        });
      } else if (error?.response?.status !== 404) {
        // Don't show toast for 404, as user might not be in any teams
        toast.error('Error', {
          description: errorMessage,
        });
      }
      
      console.error('Error fetching user teams:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    teams,
    loading,
    error,
    fetchUserTeams,
  };
}
