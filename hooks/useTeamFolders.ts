'use client';

import { useState, useCallback } from 'react';
import type { DashboardFolder } from '@/types/grafana';

export function useTeamFolders() {
  const [folders, setFolders] = useState<DashboardFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamFolders = useCallback(async (teamId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching folders for team ID: ${teamId}`);
      
      const response = await fetch(`/api/grafana/teams/${teamId}/folders`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch team folders');
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} folders for team ${teamId}`);
      setFolders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch team folders';
      console.error('Error fetching team folders:', err);
      setError(errorMessage);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    folders,
    loading,
    error,
    fetchTeamFolders,
  };
}
