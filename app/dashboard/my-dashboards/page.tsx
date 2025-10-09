"use client";

import React, { useEffect, useMemo } from "react";
import { DashboardPanelExtractor } from "@/components/dashboards/DashboardPanelExtractor";
import { useUserDashboards } from "@/hooks/useUserDashboards";
import { useAuth } from "@/hooks/useAuth";

function MyDashboardsPage(): React.ReactElement {
  const { user } = useAuth();
  const {
    dashboards,
    folders,
    loading,
    orgId,
    fetchUserAccessibleDashboards,
  } = useUserDashboards();

  // Deduplicate folders by UID
  const uniqueFolders = useMemo(
    () =>
      folders.filter(
        (folder, index, self) =>
          index === self.findIndex((f) => f.uid === folder.uid)
      ),
    [folders]
  );

  // Fetch user-specific dashboards based on organization and team access
  useEffect(() => {
    if (user?.email && user?.organization) {
      console.log(
        `🔄 Fetching user-specific dashboards for: ${user.email} in organization: ${user.organization}`
      );
      fetchUserAccessibleDashboards(user.email, user.organization);
    }
  }, [user?.email, user?.organization, fetchUserAccessibleDashboards]);

  // Debug: Log dashboards and folders when they change
  useEffect(() => {
    console.log("📊 Dashboards loaded:", dashboards.length, dashboards);
    console.log("📁 Folders loaded:", folders.length, folders);
  }, [dashboards, folders]);

  const isLoading = loading;

  return (
    <div className="space-normal w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-tight">
          <h1 className="text-heading-1 text-foreground mb-1">
            My Dashboards
          </h1>
          <p className="text-body text-gray-600">
            View dashboard panels from your team folders
          </p>
        </div>
      </div>

      {!user?.email && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-body text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          <div>
            <p className="font-medium">User Information Required</p>
            <p className="mt-1">
              Please ensure your user account has proper email and organization information.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading dashboards and folders...
        </div>
      ) : !user?.email ? (
        <div className="text-center py-8 text-muted-foreground">
          Please ensure your user account has proper email information.
        </div>
      ) : uniqueFolders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">
            No folders available for your team.
          </p>
          <p className="text-body text-muted-foreground">
            Contact your administrator to grant folder permissions to your team.
          </p>
        </div>
      ) : dashboards.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">
            No dashboards found in your team&apos;s folders.
          </p>
        </div>
      ) : (
        <DashboardPanelExtractor
          folders={uniqueFolders}
          dashboards={dashboards}
          orgId={orgId}
        />
      )}
    </div>
  );
}

export default MyDashboardsPage;
