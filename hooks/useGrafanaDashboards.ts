import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { Dashboard } from '@/types/grafana';
import { toast } from 'sonner';

export function useGrafanaDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboards = useCallback(async (folderUid?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = folderUid 
        ? await grafanaAPI.getDashboardsByFolder(folderUid)
        : await grafanaAPI.listDashboards();
      setDashboards(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch dashboards';
      setError(errorMessage);
      
      // Show helpful toast for permission errors
      if (error?.response?.status === 403) {
        toast.error('Permission Error', {
          description: error?.response?.data?.hint || 'Your Grafana API key lacks the required permissions to list dashboards.',
        });
      } else {
        toast.error('Error', {
          description: errorMessage,
        });
      }
      
      console.error('Error fetching dashboards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchDashboards = useCallback(async (query?: string, tag?: string, folderIds?: number[]) => {
    try {
      setLoading(true);
      setError(null);
      const data = await grafanaAPI.searchDashboards(query, tag, folderIds);
      setDashboards(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to search dashboards';
      setError(errorMessage);
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error searching dashboards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserDashboards = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await grafanaAPI.getUserDashboards(userId);
      setDashboards(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch user dashboards';
      setError(errorMessage);
      
      // Show helpful toast for permission errors
      if (error?.response?.status === 403) {
        toast.error('Permission Error', {
          description: error?.response?.data?.hint || 'Your Grafana API key lacks the required permissions to fetch user dashboards.',
        });
      } else {
        toast.error('Error', {
          description: errorMessage,
        });
      }
      
      console.error('Error fetching user dashboards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDashboard = useCallback(async (uid: string) => {
    try {
      await grafanaAPI.deleteDashboard(uid);
      toast.success('Dashboard deleted successfully');
      // Refresh the list
      setDashboards(prev => prev.filter(d => d.uid !== uid));
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete dashboard';
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error deleting dashboard:', err);
      throw err;
    }
  }, []);

  return {
    dashboards,
    loading,
    error,
    fetchDashboards,
    fetchUserDashboards,
    searchDashboards,
    deleteDashboard,
  };
}
