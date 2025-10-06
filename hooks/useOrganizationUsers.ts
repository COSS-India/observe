'use client';

import { useCallback, useEffect } from 'react';
import { useOrganizationUsersStore } from '@/lib/store/organizationUsersStore';
import { useAuthStore } from '@/lib/store/authStore';

export function useOrganizationUsers() {
  const { user } = useAuthStore();
  const {
    organizationUsers,
    loading,
    error,
    lastSyncTime,
    fetchAndFilterUsers,
    clearUsers,
    refreshUsers
  } = useOrganizationUsersStore();

  // Auto-fetch users when the hook is used and user is authenticated
  useEffect(() => {
    if (user?.organization && organizationUsers.length === 0) {
      fetchAndFilterUsers(user.organization);
    }
  }, [user?.organization, organizationUsers.length, fetchAndFilterUsers]);

  const syncUsers = useCallback(async () => {
    if (!user?.organization) {
      console.warn('No user organization available for syncing users');
      return;
    }
    
    await fetchAndFilterUsers(user.organization);
  }, [user?.organization, fetchAndFilterUsers]);

  const forceRefresh = useCallback(async () => {
    if (!user?.organization) {
      console.warn('No user organization available for refreshing users');
      return;
    }
    
    await refreshUsers(user.organization);
  }, [user?.organization, refreshUsers]);

  const getUsersCount = useCallback(() => {
    return organizationUsers.length;
  }, [organizationUsers.length]);

  const getUsersByRole = useCallback((role?: string) => {
    if (!role) return organizationUsers;
    return organizationUsers.filter(user => 
      user.role?.toLowerCase() === role.toLowerCase()
    );
  }, [organizationUsers]);

  const isUserInOrganization = useCallback((userName: string) => {
    return organizationUsers.some(user => 
      user.login.toLowerCase() === userName.toLowerCase() ||
      user.email.toLowerCase() === userName.toLowerCase()
    );
  }, [organizationUsers]);

  const getLastSyncDate = useCallback(() => {
    return lastSyncTime ? new Date(lastSyncTime) : null;
  }, [lastSyncTime]);

  const needsSync = useCallback(() => {
    if (!lastSyncTime) return true;
    
    // Consider data stale after 1 hour
    const oneHour = 60 * 60 * 1000;
    return Date.now() - lastSyncTime > oneHour;
  }, [lastSyncTime]);

  return {
    // Data
    organizationUsers,
    loading,
    error,
    userOrganization: user?.organization,
    
    // Actions
    syncUsers,
    forceRefresh,
    clearUsers,
    
    // Utilities
    getUsersCount,
    getUsersByRole,
    isUserInOrganization,
    getLastSyncDate,
    needsSync,
  };
}
