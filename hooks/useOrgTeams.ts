'use client';

import { useState, useCallback } from 'react';
import type { Team } from '@/types/grafana';

export function useOrgTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgTeams = useCallback(async (orgId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching teams for organization ID: ${orgId}`);
      
      const response = await fetch(`/api/grafana/orgs/${orgId}/teams`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization teams');
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} teams for organization ${orgId}`);
      setTeams(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization teams';
      console.error('Error fetching organization teams:', err);
      setError(errorMessage);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    teams,
    loading,
    error,
    fetchOrgTeams,
  };
}
