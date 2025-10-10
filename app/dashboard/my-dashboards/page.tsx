"use client";

import React, { useEffect, useMemo } from "react";
import { DashboardPanelExtractor } from "@/components/dashboards/DashboardPanelExtractor";
import { useTeamDashboards } from "@/hooks/useTeamDashboards";
import { useTeamFolders } from "@/hooks/useTeamFolders";
import { useAuth } from "@/hooks/useAuth";

function MyDashboardsPage(): React.ReactElement {
  const { user } = useAuth();
  const {
    dashboards,
    loading: dashboardsLoading,
    fetchTeamDashboards,
  } = useTeamDashboards();
  const {
    folders,
    loading: foldersLoading,
    fetchTeamFolders,
  } = useTeamFolders();

  // Deduplicate folders by UID
  const uniqueFolders = useMemo(
    () =>
      folders.filter(
        (folder, index, self) =>
          index === self.findIndex((f) => f.uid === folder.uid)
      ),
    [folders]
  );

  // Fetch team-based dashboards and folders when user has a team ID
  useEffect(() => {
    if (user?.grafanaTeamId) {
      console.log(
        `🔄 Fetching team-based dashboards and folders for Team ID: ${user.grafanaTeamId}`
      );
      fetchTeamDashboards(user.grafanaTeamId);
      fetchTeamFolders(user.grafanaTeamId);
    }
  }, [user?.grafanaTeamId, fetchTeamDashboards, fetchTeamFolders]);

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
          <p className="text-body text-gray-600">
            View dashboard panels from your team folders
          </p>
        </div>
      </div>

      {!user?.grafanaTeamId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-body text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          <div>
            <p className="font-medium">Team Mapping Required</p>
            <p className="mt-1">
              Your account needs to be mapped to a Grafana team. Your
              organization is <strong>{user?.organization}</strong>. Please
              ensure a team with this name exists in Grafana, or contact your
              administrator.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading dashboards and folders...
        </div>
      ) : !user?.grafanaTeamId ? (
        <div className="text-center py-8 text-muted-foreground">
          Please configure your team mapping to view dashboards.
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
        />
      )}
    </div>
  );
}

export default MyDashboardsPage;
