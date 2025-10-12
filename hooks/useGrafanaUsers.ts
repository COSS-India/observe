'use client';

import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { GrafanaUser, CreateGrafanaUserPayload, UpdateGrafanaUserPayload } from '@/types/grafana';
import { toast } from 'sonner';
import { useOrgContextStore } from '@/lib/store/orgContextStore';
import { useAuth } from './useAuth';
import { isSuperAdmin } from '@/lib/utils/permissions';

export function useGrafanaUsers() {
  const [users, setUsers] = useState<GrafanaUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedOrgId } = useOrgContextStore();
  const { user } = useAuth();
  const isUserSuperAdmin = isSuperAdmin(user);

  const fetchUsers = useCallback(async (orgId?: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await grafanaAPI.listUsers(orgId);
      setUsers(data);
    } catch (err: unknown) {
      let message = 'Failed to fetch users';
      
      // Handle axios error response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.response?.data) {
        message = error.response.data.error || error.response.data.message || message;
        
        // Show hint for permission errors
        if (error.response.data.hint) {
          toast.error(message, {
            description: error.response.data.hint,
            duration: 10000,
          });
        } else {
          toast.error(message);
        }
      } else if (err instanceof Error) {
        message = err.message;
        toast.error(message);
      } else {
        toast.error(message);
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: CreateGrafanaUserPayload) => {
    setLoading(true);
    setError(null);
    try {
      // Pass orgId if user is super admin and has an org selected
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      const result = await grafanaAPI.createUser(userData, effectiveOrgId);
      toast.success(result.message || 'User created successfully');
      // Refresh with the same org context
      await fetchUsers(effectiveOrgId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, isUserSuperAdmin, selectedOrgId]);

  const updateUser = useCallback(async (id: number, userData: UpdateGrafanaUserPayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await grafanaAPI.updateUser(id, userData);
      toast.success(result.message || 'User updated successfully');
      // Refresh with current org context
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      await fetchUsers(effectiveOrgId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, isUserSuperAdmin, selectedOrgId]);

  const deleteUser = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await grafanaAPI.deleteUser(id);
      toast.success(result.message || 'User deleted successfully');
      // Refresh with current org context
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      await fetchUsers(effectiveOrgId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, isUserSuperAdmin, selectedOrgId]);

  const toggleUserStatus = useCallback(async (id: number, isDisabled: boolean) => {
    setLoading(true);
    setError(null);
    try {
      // Pass orgId if user is super admin and has an org selected
      const effectiveOrgId = isUserSuperAdmin ? selectedOrgId : null;
      
      const result = isDisabled 
        ? await grafanaAPI.enableUser(id, effectiveOrgId)
        : await grafanaAPI.disableUser(id, effectiveOrgId);
      toast.success(result.message || `User ${isDisabled ? 'enabled' : 'disabled'} successfully`);
      // Refresh with current org context
      await fetchUsers(effectiveOrgId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle user status';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, isUserSuperAdmin, selectedOrgId]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
  };
}
