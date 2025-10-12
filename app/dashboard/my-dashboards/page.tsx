"use client";

import React, { useEffect, useMemo } from "react";
import { DashboardPanelExtractor } from "@/components/dashboards/DashboardPanelExtractor";
import { useOrgDashboards } from "@/hooks/useOrgDashboards";
import { useOrgFolders } from "@/hooks/useOrgFolders";
import { useUserDashboards } from "@/hooks/useUserDashboards";
import { useUserFolders } from "@/hooks/useUserFolders";
import { useAuth } from "@/hooks/useAuth";
import { useOrgContextStore } from "@/lib/store/orgContextStore";
import { isSuperAdmin } from "@/lib/utils/permissions";

function MyDashboardsPage(): React.ReactElement {
  const { user } = useAuth();
  const isUserSuperAdmin = isSuperAdmin(user);
  const { selectedOrgName } = useOrgContextStore();

  // Organization-based hooks (for super admin)
  const {
    dashboards: orgDashboards,
    loading: orgDashboardsLoading,
    fetchOrgDashboards,
  } = useOrgDashboards();
  const {
    folders: orgFolders,
    loading: orgFoldersLoading,
    fetchOrgFolders,
  } = useOrgFolders();

  // User-based hooks (for non-super admin)
  const {
    dashboards: userDashboards,
    loading: userDashboardsLoading,
    fetchUserDashboards,
  } = useUserDashboards();
  const {
    folders: userFolders,
    loading: userFoldersLoading,
    fetchUserFolders,
  } = useUserFolders();

  // Determine which data to use based on user role
  const dashboards = isUserSuperAdmin ? orgDashboards : userDashboards;
  const folders = isUserSuperAdmin ? orgFolders : userFolders;
  const dashboardsLoading = isUserSuperAdmin ? orgDashboardsLoading : userDashboardsLoading;
  const foldersLoading = isUserSuperAdmin ? orgFoldersLoading : userFoldersLoading;

  // Deduplicate folders by UID
  const uniqueFolders = useMemo(
    () =>
      folders.filter(
        (folder, index, self) =>
          index === self.findIndex((f) => f.uid === folder.uid)
      ),
    [folders]
  );

  // Fetch dashboards and folders based on user role
  useEffect(() => {
    if (isUserSuperAdmin && user?.grafanaOrgId) {
      // Super admin: fetch all org data
      console.log(
        `🔄 [Super Admin] Fetching organization-based dashboards and folders for Org ID: ${user.grafanaOrgId}`
      );
      fetchOrgDashboards(user.grafanaOrgId);
      fetchOrgFolders(user.grafanaOrgId);
    } else if (!isUserSuperAdmin && user?.grafanaUserId && user?.grafanaOrgId) {
      // Non-super admin: fetch user-specific data based on permissions
      console.log(
        `🔄 [User] Fetching permission-based dashboards and folders for Grafana User ID: ${user.grafanaUserId} in Org: ${user.grafanaOrgId}`
      );
      fetchUserDashboards(user.grafanaUserId, user.grafanaOrgId);
      fetchUserFolders(user.grafanaUserId, user.grafanaOrgId);
    }
  }, [
    user?.grafanaOrgId,
    user?.grafanaUserId,
    isUserSuperAdmin,
    fetchOrgDashboards,
    fetchOrgFolders,
    fetchUserDashboards,
    fetchUserFolders,
  ]);

  // Debug: Log dashboards and folders when they change
  useEffect(() => {
    console.log("📊 Dashboards loaded:", dashboards.length, dashboards);
    console.log("📁 Folders loaded:", folders.length, folders);
    console.log("👤 User role:", isUserSuperAdmin ? "Super Admin" : "Regular User");
    if (!isUserSuperAdmin) {
      console.log("🔑 Grafana User ID:", user?.grafanaUserId || "Not found");
    }
  }, [dashboards, folders, isUserSuperAdmin, user?.grafanaUserId]);

  const isLoading = dashboardsLoading || foldersLoading;

  // Check if user needs Grafana account setup
  const needsGrafanaAccount = !isUserSuperAdmin && !user?.grafanaUserId;
  const hasOrgMapping = !!user?.grafanaOrgId;

  return (
    <div className="space-normal w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-tight">
          <h1 className="text-heading-1 text-foreground mb-1">
            My Dashboards
          </h1>
          {/* <p className="text-body text-gray-600">
            View dashboard panels from your team folders
          </p> */}
        </div>
      </div>

      {/* Organization Mapping Warning */}
      {!hasOrgMapping && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-body text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          <div>
            <p className="font-medium">Organization Mapping Required</p>
            <p className="mt-1">
              Your account needs to be mapped to a Grafana organization. Your
              organization is <strong>{user?.organization}</strong>. Please
              ensure an organization with this name exists in Grafana, or contact your
              administrator.
            </p>
          </div>
        </div>
      )}

      {/* Grafana User Account Warning (Non-Super Admin Only) */}
      {needsGrafanaAccount && hasOrgMapping && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-body text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
          <div>
            <p className="font-medium">Grafana User Account Not Found</p>
            <p className="mt-1">
              Your email <strong>{user?.email}</strong> was not found in Grafana organization{" "}
              <strong>{user?.organization}</strong>. To access dashboards, please contact your 
              administrator to create a Grafana user account with this email and assign appropriate 
              folder permissions.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading dashboards and folders...
        </div>
      ) : !hasOrgMapping ? (
        <div className="text-center py-8 text-muted-foreground">
          Please configure your organization mapping to view dashboards.
        </div>
      ) : needsGrafanaAccount ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">
            No Grafana user account found.
          </p>
          <p className="text-body text-muted-foreground">
            Contact your administrator to create a Grafana user with email: <strong>{user?.email}</strong>
          </p>
        </div>
      ) : uniqueFolders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">
            {isUserSuperAdmin 
              ? "No folders available in your organization."
              : "No folders accessible to you."}
          </p>
          <p className="text-body text-muted-foreground">
            {isUserSuperAdmin
              ? "Create folders in Grafana to organize your dashboards."
              : "Contact your administrator to grant folder permissions."}
          </p>
        </div>
      ) : dashboards.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">
            {isUserSuperAdmin
              ? "No dashboards found in your organization's folders."
              : "No dashboards found in your accessible folders."}
          </p>
        </div>
      ) : (
        <DashboardPanelExtractor
          folders={uniqueFolders}
          dashboards={dashboards}
          organizationName={isUserSuperAdmin ? (selectedOrgName || undefined) : user?.organization}
        />
      )}
    </div>
  );
}

export default MyDashboardsPage;
