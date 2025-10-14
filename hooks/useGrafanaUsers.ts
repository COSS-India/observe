'use client';

import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { GrafanaUser, CreateGrafanaUserPayload, UpdateGrafanaUserPayload } from '@/types/grafana';
import { toast } from 'sonner';

export function useGrafanaUsers() {
  const [users, setUsers] = useState<GrafanaUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await grafanaAPI.listUsers();
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
      const result = await grafanaAPI.createUser(userData);
      toast.success(result.message || 'User created successfully');
      await fetchUsers();
      return result;
    } catch (err: unknown) {
      let message = 'Failed to create user';
      
      // Handle axios error response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.response?.data) {
        message = error.response.data.error || error.response.data.message || message;
        
        // Show hint for specific errors
        if (error.response.data.hint) {
          toast.error(message, {
            description: error.response.data.hint,
            duration: 10000,
          });
        } else {
          toast.error(message, {
            duration: 8000,
          });
        }
      } else if (err instanceof Error) {
        message = err.message;
        toast.error(message);
      } else {
        toast.error(message);
      }
      
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (id: number, userData: UpdateGrafanaUserPayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await grafanaAPI.updateUser(id, userData);
      toast.success(result.message || 'User updated successfully');
      await fetchUsers();
      return result;
    } catch (err: unknown) {
      let message = 'Failed to update user';
      
      // Handle axios error response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.response?.data) {
        message = error.response.data.error || error.response.data.message || message;
        
        // Show hint for specific errors
        if (error.response.data.hint) {
          toast.error(message, {
            description: error.response.data.hint,
            duration: 10000,
          });
        } else {
          toast.error(message, {
            duration: 8000,
          });
        }
      } else if (err instanceof Error) {
        message = err.message;
        toast.error(message);
      } else {
        toast.error(message);
      }
      
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await grafanaAPI.deleteUser(id);
      toast.success(result.message || 'User deleted successfully');
      await fetchUsers();
      return result;
    } catch (err: unknown) {
      let message = 'Failed to delete user';
      
      // Handle axios error response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.response?.data) {
        message = error.response.data.error || error.response.data.message || message;
        
        // Show hint for specific errors
        if (error.response.data.hint) {
          toast.error(message, {
            description: error.response.data.hint,
            duration: 10000,
          });
        } else {
          toast.error(message, {
            duration: 8000,
          });
        }
      } else if (err instanceof Error) {
        message = err.message;
        toast.error(message);
      } else {
        toast.error(message);
      }
      
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const toggleUserStatus = useCallback(async (id: number, isDisabled: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = isDisabled 
        ? await grafanaAPI.enableUser(id)
        : await grafanaAPI.disableUser(id);
      toast.success(result.message || `User ${isDisabled ? 'enabled' : 'disabled'} successfully`);
      await fetchUsers();
      return result;
    } catch (err: unknown) {
      let message = 'Failed to toggle user status';
      
      // Handle axios error response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.response?.data) {
        message = error.response.data.error || error.response.data.message || message;
        
        // Show hint for specific errors
        if (error.response.data.hint) {
          toast.error(message, {
            description: error.response.data.hint,
            duration: 10000,
          });
        } else {
          toast.error(message, {
            duration: 8000,
          });
        }
      } else if (err instanceof Error) {
        message = err.message;
        toast.error(message);
      } else {
        toast.error(message);
      }
      
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

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
