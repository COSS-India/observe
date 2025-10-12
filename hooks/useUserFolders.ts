'use client';

import { useState, useCallback } from 'react';
import type { DashboardFolder } from '@/types/grafana';

export function useUserFolders() {
  const [folders, setFolders] = useState<DashboardFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserFolders = useCallback(async (userId: number, orgId?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching folders for Grafana user ID: ${userId}${orgId ? ` in org ${orgId}` : ''}`);
      
      const url = orgId 
        ? `/api/grafana/users/${userId}/folders?orgId=${orgId}`
        : `/api/grafana/users/${userId}/folders`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user folders');
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} accessible folders for user ${userId}`);
      setFolders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user folders';
      console.error('Error fetching user folders:', err);
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
    fetchUserFolders,
  };
}
