"use client";

import React, { useEffect, useMemo } from "react";
import { DashboardPanelExtractor } from "@/components/dashboards/DashboardPanelExtractor";
import { useOrgDashboards } from "@/hooks/useOrgDashboards";
import { useOrgFolders } from "@/hooks/useOrgFolders";
import { useAuth } from "@/hooks/useAuth";

function MyDashboardsPage(): React.ReactElement {
  const { user } = useAuth();
  const {
    dashboards,
    loading: dashboardsLoading,
    fetchOrgDashboards,
  } = useOrgDashboards();
  const {
    folders,
    loading: foldersLoading,
    fetchOrgFolders,
  } = useOrgFolders();

  // Deduplicate folders by UID
  const uniqueFolders = useMemo(
    () =>
      folders.filter(
        (folder, index, self) =>
          index === self.findIndex((f) => f.uid === folder.uid)
      ),
    [folders]
  );

  // Fetch organization-based dashboards and folders when user has an org ID
  useEffect(() => {
    if (user?.grafanaOrgId) {
      console.log(
        `🔄 Fetching organization-based dashboards and folders for Org ID: ${user.grafanaOrgId}`
      );
      fetchOrgDashboards(user.grafanaOrgId);
      fetchOrgFolders(user.grafanaOrgId);
    }
  }, [user?.grafanaOrgId, fetchOrgDashboards, fetchOrgFolders]);

  // Debug: Log dashboards and folders when they change
  useEffect(() => {
    console.log("📊 Dashboards loaded:", dashboards.length, dashboards);
    console.log("📁 Folders loaded:", folders.length, folders);
  }, [dashboards, folders]);

  const isLoading = dashboardsLoading || foldersLoading;

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

      {!user?.grafanaOrgId && (
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

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading dashboards and folders...
        </div>
      ) : !user?.grafanaOrgId ? (
        <div className="text-center py-8 text-muted-foreground">
          Please configure your organization mapping to view dashboards.
        </div>
      ) : uniqueFolders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">
            No folders available for your organization.
          </p>
          <p className="text-body text-muted-foreground">
            Contact your administrator to grant folder permissions to your organization.
          </p>
        </div>
      ) : dashboards.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">
            No dashboards found in your organization&apos;s folders.
          </p>
        </div>
      ) : (
        <DashboardPanelExtractor
          folders={uniqueFolders}
          dashboards={dashboards}
        />
      )}
    </div>
  );
}

export default MyDashboardsPage;
