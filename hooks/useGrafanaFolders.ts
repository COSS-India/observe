import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { DashboardFolder } from '@/types/grafana';
import { toast } from 'sonner';
import { useOrgContextStore } from '@/lib/store/orgContextStore';
import { useAuth } from './useAuth';
import { isSuperAdmin } from '@/lib/utils/permissions';

export function useGrafanaFolders() {
  const [folders, setFolders] = useState<DashboardFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedOrgId } = useOrgContextStore();
  const { user } = useAuth();
  const isUserSuperAdmin = isSuperAdmin(user);

  const fetchFolders = useCallback(async (orgId?: number | null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await grafanaAPI.listFolders(orgId);
      // Filter out the "General" folder
      const filteredFolders = Array.isArray(data) 
        ? data.filter((folder) => 
            folder.uid !== '' && 
            folder.uid !== 'general' && 
            folder.title?.toLowerCase() !== 'general'
          )
        : [];
      setFolders(filteredFolders);
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

  const fetchUserFolders = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await grafanaAPI.getUserFolders(userId);
      // Filter out the "General" folder
      const filteredFolders = Array.isArray(data) 
        ? data.filter((folder) => 
            folder.uid !== '' && 
            folder.uid !== 'general' && 
            folder.title?.toLowerCase() !== 'general'
          )
        : [];
      setFolders(filteredFolders);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch user folders';
      setError(errorMessage);
      
      // Show helpful toast for permission errors
      if (error?.response?.status === 403) {
        toast.error('Permission Error', {
          description: error?.response?.data?.hint || 'Your Grafana API key lacks the required permissions to fetch user folders.',
        });
      } else {
        toast.error('Error', {
          description: errorMessage,
        });
      }
      
      console.error('Error fetching user folders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFolder = useCallback(async (uid: string) => {
    try {
      await grafanaAPI.deleteFolder(uid);
      toast.success('Folder deleted successfully');
      // Refresh with current org context
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      await fetchFolders(effectiveOrgId);
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
  }, [fetchFolders, isUserSuperAdmin, selectedOrgId]);

  const createFolder = useCallback(async (folderData: { title: string }) => {
    try {
      // Pass orgId if user is super admin and has an org selected
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      const response = await grafanaAPI.createFolder(folderData, effectiveOrgId);
      toast.success('Folder created successfully');
      // Refresh with the same org context
      await fetchFolders(effectiveOrgId);
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
  }, [fetchFolders, isUserSuperAdmin, selectedOrgId]);

  const updateFolder = useCallback(async (uid: string, folderData: { title: string; version?: number }) => {
    try {
      // Pass orgId if user is super admin and has an org selected
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      await grafanaAPI.updateFolder(uid, folderData, effectiveOrgId);
      toast.success('Folder updated successfully');
      // Refresh with the same org context
      await fetchFolders(effectiveOrgId);
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
  }, [fetchFolders, isUserSuperAdmin, selectedOrgId]);

  return {
    folders,
    loading,
    error,
    fetchFolders,
    fetchUserFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
