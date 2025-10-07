'use client';

import { useState, useCallback } from 'react';
import type { Dashboard } from '@/types/grafana';

export function useTeamDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamDashboards = useCallback(async (teamId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching dashboards for team ID: ${teamId}`);
      
      const response = await fetch(`/api/grafana/teams/${teamId}/dashboards`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch team dashboards');
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} dashboards for team ${teamId}`);
      setDashboards(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch team dashboards';
      console.error('Error fetching team dashboards:', err);
      setError(errorMessage);
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dashboards,
    loading,
    error,
    fetchTeamDashboards,
  };
}
