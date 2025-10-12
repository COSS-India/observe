'use client';

import { useState, useCallback } from 'react';
import type { DashboardFolder } from '@/types/grafana';

export function useOrgFolders() {
  const [folders, setFolders] = useState<DashboardFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgFolders = useCallback(async (orgId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching folders for organization ID: ${orgId}`);
      
      const response = await fetch(`/api/grafana/orgs/${orgId}/folders`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization folders');
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} folders for organization ${orgId}`);
      setFolders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization folders';
      console.error('Error fetching organization folders:', err);
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
    fetchOrgFolders,
  };
}
