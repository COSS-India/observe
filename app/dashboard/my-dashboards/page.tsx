"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DashboardPanelExtractor } from "@/components/dashboards/DashboardPanelExtractor";
import { useTeamDashboards } from "@/hooks/useTeamDashboards";
import { useTeamFolders } from "@/hooks/useTeamFolders";
import { useAuth } from "@/hooks/useAuth";
import { TeamSelector } from "@/components/teams/TeamSelector";
import type { Team } from "@/types/auth";

function MyDashboardsPage(): React.ReactElement {
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
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

  // Initialize selected team when user loads or teams change
  useEffect(() => {
    if (user?.teams && user.teams.length > 0) {
      // Find the team matching the current grafanaTeamId, or use first team
      const defaultTeam = user.teams.find(
        (t) => t.grafanaTeamId === user.grafanaTeamId
      ) || user.teams[0];
      setSelectedTeam(defaultTeam);
      console.log('📌 Default team set:', defaultTeam.name);
    }
  }, [user?.teams, user?.grafanaTeamId]);

  // Fetch team-based dashboards and folders when selected team changes
  useEffect(() => {
    if (selectedTeam?.grafanaTeamId) {
      console.log(
        `🔄 Fetching team-based dashboards and folders for Team: ${selectedTeam.name} (ID: ${selectedTeam.grafanaTeamId})`
      );
      fetchTeamDashboards(selectedTeam.grafanaTeamId);
      fetchTeamFolders(selectedTeam.grafanaTeamId);
    }
  }, [selectedTeam, fetchTeamDashboards, fetchTeamFolders]);

  // Debug: Log dashboards and folders when they change
  useEffect(() => {
    console.log("📊 Dashboards loaded:", dashboards.length, dashboards);
    console.log("📁 Folders loaded:", folders.length, folders);
  }, [dashboards, folders]);

  const isLoading = dashboardsLoading || foldersLoading;

  const handleTeamChange = (team: Team) => {
    console.log('👥 Team changed to:', team.name);
    setSelectedTeam(team);
  };

  // Check if user has teams
  const hasTeams = user?.teams && user.teams.length > 0;
  const hasMultipleTeams = user?.teams && user.teams.length > 1;

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

      {/* Team Selector - show only if user has multiple teams */}
      {hasMultipleTeams && user.teams && (
        <TeamSelector
          teams={user.teams}
          selectedTeam={selectedTeam}
          onTeamChange={handleTeamChange}
        />
      )}

      {!hasTeams && (
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
      ) : !hasTeams ? (
        <div className="text-center py-8 text-muted-foreground">
          Please configure your team mapping to view dashboards.
        </div>
      ) : !selectedTeam ? (
        <div className="text-center py-8 text-muted-foreground">
          Please select a team to view dashboards.
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
