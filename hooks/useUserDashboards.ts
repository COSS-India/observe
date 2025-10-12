'use client';

import { useState, useCallback } from 'react';
import type { Dashboard } from '@/types/grafana';

export function useUserDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDashboards = useCallback(async (userId: number, orgId?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching dashboards for Grafana user ID: ${userId}${orgId ? ` in org ${orgId}` : ''}`);
      
      const url = orgId 
        ? `/api/grafana/users/${userId}/dashboards?orgId=${orgId}`
        : `/api/grafana/users/${userId}/dashboards`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user dashboards');
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} accessible dashboards for user ${userId}`);
      setDashboards(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user dashboards';
      console.error('Error fetching user dashboards:', err);
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
    fetchUserDashboards,
  };
}
