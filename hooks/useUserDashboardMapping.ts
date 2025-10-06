'use client';

import { useEffect, useCallback } from 'react';
import { useUserMappingStore } from '@/lib/store/userMappingStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useGrafanaTeams } from './useGrafanaTeams';
import { useGrafanaDashboards } from './useGrafanaDashboards';
import { useGrafanaFolders } from './useGrafanaFolders';

/**
 * Custom hook to manage user-organization-team-dashboard mapping
 * 
 * This hook:
 * 1. Gets user's organization from Bhashini API (mocked)
 * 2. Maps organization to Grafana teams
 * 3. Loads accessible dashboards based on team permissions
 */
export function useUserDashboardMapping() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    userOrgMapping,
    dashboardContext,
    isLoadingContext,
    initializeUserContext,
    loadDashboardContext,
    clearContext,
    getAccessibleDashboards,
    getAccessibleFolders,
  } = useUserMappingStore();

  const { teams, loading: teamsLoading, fetchTeams } = useGrafanaTeams();
  const { dashboards, loading: dashboardsLoading, fetchDashboards } = useGrafanaDashboards();
  const { folders, loading: foldersLoading, fetchFolders } = useGrafanaFolders();

  /**
   * Fetch Grafana data when user is authenticated
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Fetching Grafana data (teams, dashboards, folders)...');
      Promise.all([
        fetchTeams(),
        fetchDashboards(),
        fetchFolders(),
      ]).catch(error => {
        console.error('Failed to fetch Grafana data:', error);
      });
    }
  }, [isAuthenticated, user, fetchTeams, fetchDashboards, fetchFolders]);

  /**
   * Initialize user context when user logs in
   */
  useEffect(() => {
    if (isAuthenticated && user && !userOrgMapping) {
      initializeUserContext(user.username, user.email).catch(error => {
        console.error('Failed to initialize user context:', error);
      });
    }
  }, [isAuthenticated, user, userOrgMapping, initializeUserContext]);

  /**
   * Load dashboard context when teams and dashboards are available
   */
  useEffect(() => {
    console.log('useUserDashboardMapping useEffect check:', {
      hasUserOrgMapping: !!userOrgMapping,
      hasDashboardContext: !!dashboardContext,
      teamsLength: teams.length,
      dashboardsLength: dashboards.length,
      foldersLength: folders.length,
      teamsLoading,
      dashboardsLoading,
      foldersLoading,
    });
    
    if (
      userOrgMapping &&
      !dashboardContext &&
      teams.length > 0 &&
      dashboards.length > 0 &&
      folders.length > 0 &&
      !teamsLoading &&
      !dashboardsLoading &&
      !foldersLoading
    ) {
      console.log('✅ Triggering loadDashboardContext');
      loadDashboardContext(teams, dashboards, folders).catch(error => {
        console.error('Failed to load dashboard context:', error);
      });
    } else {
      console.log('❌ Not triggering loadDashboardContext - conditions not met');
    }
  }, [
    userOrgMapping,
    dashboardContext,
    teams,
    dashboards,
    folders,
    teamsLoading,
    dashboardsLoading,
    foldersLoading,
    loadDashboardContext,
  ]);

  /**
   * Clear context when user logs out
   */
  useEffect(() => {
    if (!isAuthenticated && (userOrgMapping || dashboardContext)) {
      clearContext();
    }
  }, [isAuthenticated, userOrgMapping, dashboardContext, clearContext]);

  /**
   * Get dashboards filtered by user's team access
   */
  const getFilteredDashboards = useCallback(() => {
    if (!dashboardContext) {
      return dashboards; // Return all if no context (admin/fallback)
    }
    
    const accessibleUids = new Set(
      dashboardContext.accessibleDashboards.map(d => d.uid)
    );
    
    return dashboards.filter(dashboard => accessibleUids.has(dashboard.uid));
  }, [dashboardContext, dashboards]);

  /**
   * Get folders filtered by user's team access
   */
  const getFilteredFolders = useCallback(() => {
    if (!dashboardContext) {
      return folders; // Return all if no context (admin/fallback)
    }
    
    const accessibleUids = new Set(
      dashboardContext.accessibleFolders.map(f => f.uid)
    );
    
    return folders.filter(folder => accessibleUids.has(folder.uid));
  }, [dashboardContext, folders]);

  /**
   * Get user's teams
   */
  const getUserTeams = useCallback(() => {
    return dashboardContext?.teams || [];
  }, [dashboardContext]);

  /**
   * Get user's organization info
   */
  const getUserOrganization = useCallback(() => {
    return dashboardContext?.organization || null;
  }, [dashboardContext]);

  const isLoading = isLoadingContext || teamsLoading || dashboardsLoading || foldersLoading;

  return {
    // Context data
    userOrgMapping,
    dashboardContext,
    
    // Loading state
    isLoading,
    isReady: !!dashboardContext && !isLoading,
    
    // Filtered data
    filteredDashboards: getFilteredDashboards(),
    filteredFolders: getFilteredFolders(),
    accessibleDashboards: getAccessibleDashboards(),
    accessibleFolders: getAccessibleFolders(),
    
    // User-specific data
    userTeams: getUserTeams(),
    userOrganization: getUserOrganization(),
    
    // Raw data (for admin/debugging)
    allDashboards: dashboards,
    allFolders: folders,
    allTeams: teams,
  };
}
