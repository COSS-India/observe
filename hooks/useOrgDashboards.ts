'use client';

import { useState, useCallback } from 'react';
import type { Dashboard } from '@/types/grafana';

export function useOrgDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgDashboards = useCallback(async (orgId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching dashboards for organization ID: ${orgId}`);
      
      const response = await fetch(`/api/grafana/orgs/${orgId}/dashboards`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization dashboards');
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} dashboards for organization ${orgId}`);
      setDashboards(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization dashboards';
      console.error('Error fetching organization dashboards:', err);
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
    fetchOrgDashboards,
  };
}
