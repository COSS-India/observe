import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { Organization } from '@/types/grafana';
import { toast } from 'sonner';

export function useGrafanaOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await grafanaAPI.listOrganizations();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch organizations';
      setError(errorMessage);
      
      // Show helpful toast for permission errors
      if (error?.response?.status === 403) {
        toast.error('Permission Error', {
          description: error?.response?.data?.hint || 'Your Grafana API key lacks the required permissions to list organizations.',
        });
      } else {
        toast.error('Error', {
          description: errorMessage,
        });
      }
      
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOrganization = useCallback(async (id: number) => {
    try {
      await grafanaAPI.deleteOrganization(id);
      toast.success('Organization deleted successfully');
      // Refresh the list
      await fetchOrganizations();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete organization';
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error deleting organization:', err);
      throw err;
    }
  }, [fetchOrganizations]);

  const createOrganization = useCallback(async (orgData: { name: string }) => {
    try {
      const response = await grafanaAPI.createOrganization(orgData);
      toast.success('Organization created successfully');
      await fetchOrganizations();
      return response;
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to create organization';
      
      // Show specific hint for permission errors
      if (error?.response?.status === 403) {
        toast.error('Permission Error', {
          description: error?.response?.data?.hint || 'Creating organizations requires Server Admin permissions.',
        });
      } else {
        toast.error('Error', {
          description: errorMessage,
        });
      }
      
      console.error('Error creating organization:', err);
      throw err;
    }
  }, [fetchOrganizations]);

  const updateOrganization = useCallback(async (id: number, orgData: { name?: string }) => {
    try {
      await grafanaAPI.updateOrganization(id, orgData);
      toast.success('Organization updated successfully');
      await fetchOrganizations();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to update organization';
      toast.error('Error', {
        description: errorMessage,
      });
      console.error('Error updating organization:', err);
      throw err;
    }
  }, [fetchOrganizations]);

  return {
    organizations,
    loading,
    error,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  };
}
