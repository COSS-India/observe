import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { DashboardFolder } from '@/types/grafana';
import { toast } from 'sonner';

export function useGrafanaFolders() {
  const [folders, setFolders] = useState<DashboardFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await grafanaAPI.listFolders();
      setFolders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch folders';
      setError(errorMessage);
      
      // Show helpful toast for permission errors
      if (error?.response?.status === 403) {
        toast.error('Permission Error', {
          description: error?.response?.data?.hint || 'Your Grafana API key lacks the required permissions to list folders.',
        });
      } else {
        toast.error('Error', {
          description: errorMessage,
        });
      }
      
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFolder = useCallback(async (uid: string) => {
    try {
      await grafanaAPI.deleteFolder(uid);
      toast.success('Folder deleted successfully');
      // Refresh the list
      await fetchFolders();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete folder';
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error deleting folder:', err);
      throw err;
    }
  }, [fetchFolders]);

  const createFolder = useCallback(async (folderData: { title: string }) => {
    try {
      const response = await grafanaAPI.createFolder(folderData);
      toast.success('Folder created successfully');
      await fetchFolders();
      return response;
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to create folder';
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error creating folder:', err);
      throw err;
    }
  }, [fetchFolders]);

  const updateFolder = useCallback(async (uid: string, folderData: { title: string; version?: number }) => {
    try {
      await grafanaAPI.updateFolder(uid, folderData);
      toast.success('Folder updated successfully');
      await fetchFolders();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to update folder';
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error updating folder:', err);
      throw err;
    }
  }, [fetchFolders]);

  return {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
