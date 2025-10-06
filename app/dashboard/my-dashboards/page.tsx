'use client';

import React, { useEffect, useState } from 'react';
import { Grid, LayoutGrid, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardGrid } from '@/components/dashboards/DashboardGrid';
import { DashboardViewer } from '@/components/dashboards/DashboardViewer';
import { DashboardPanelGrid, type PanelConfig } from '@/components/dashboards/DashboardPanelGrid';
import { useGrafanaDashboards } from '@/hooks/useGrafanaDashboards';
import { useGrafanaFolders } from '@/hooks/useGrafanaFolders';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import type { Dashboard } from '@/types/grafana';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const DASHBOARD_PANELS: PanelConfig[] = [
  {
    id: 'customer-service-panel-14',
    title: 'Customer Service - Panel 14',
    src: 'http://localhost:3000/d-solo/dhruva-customer-service-dashboard-v2/dhruva-customer-service-dashboard-v2?orgId=1&from=1759658254679&to=1759744654679&timezone=browser&var-customer=default&var-service_type=All&refresh=1m&panelId=14&__feature.dashboardSceneSolo=true',
    height: 300,
  },
  {
    id: 'customer-service-panel-13',
    title: 'Customer Service - Panel 13',
    src: 'http://localhost:3000/d-solo/dhruva-customer-service-dashboard-v2/dhruva-customer-service-dashboard-v2?orgId=1&from=1759658254679&to=1759744654679&timezone=browser&var-customer=default&var-service_type=All&refresh=1m&panelId=13&__feature.dashboardSceneSolo=true',
    height: 300,
  },
  {
    id: 'devops-panel-27',
    title: 'DevOps Operations - Panel 27',
    src: 'http://localhost:3000/d-solo/dhruva-devops-operational-dashboard-v2/dhruva-devops-operations-dashboard-v2?orgId=1&from=1757645161676&to=1761331561676&timezone=browser&var-customer=$__all&var-app=$__all&refresh=30s&panelId=27&__feature.dashboardSceneSolo=true',
    height: 300,
  },
  {
    id: 'devops-panel-8',
    title: 'DevOps Operations - Panel 8',
    src: 'http://localhost:3000/d-solo/dhruva-devops-operational-dashboard-v2/dhruva-devops-operations-dashboard-v2?orgId=1&from=1757645161676&to=1761331561676&timezone=browser&var-customer=$__all&var-app=$__all&refresh=30s&panelId=8&__feature.dashboardSceneSolo=true',
    height: 300,
  },
  {
    id: 'devops-panel-11',
    title: 'DevOps Operations - Panel 11',
    src: 'http://localhost:3000/d-solo/dhruva-devops-operational-dashboard-v2/dhruva-devops-operations-dashboard-v2?orgId=1&from=1757645161676&to=1761331561676&timezone=browser&var-customer=$__all&var-app=$__all&refresh=30s&panelId=11&__feature.dashboardSceneSolo=true',
    height: 300,
  },
];

function MyDashboardsPage(): React.ReactElement {
  const { user } = useAuth();
  const { organizationUsers, syncUsers } = useOrganizationUsers();
  const { dashboards, loading: dashboardsLoading, fetchUserDashboards } = useGrafanaDashboards();
  const { folders, loading: foldersLoading, fetchUserFolders } = useGrafanaFolders();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'viewer'>('grid');
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<Dashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'panels' | 'browse'>('panels');
  const [effectiveGrafanaUserId, setEffectiveGrafanaUserId] = useState<number | undefined>(undefined);

  // Determine the effective Grafana user ID
  useEffect(() => {
    // Priority 1: Use the grafanaUserId from login if available
    if (user?.grafanaUserId) {
      setEffectiveGrafanaUserId(user.grafanaUserId);
      return;
    }

    // Priority 2: Try to find the user in the organization users list
    // This handles cases where the user was manually mapped
    if (user?.email && organizationUsers.length > 0) {
      const matchedGrafanaUser = organizationUsers.find(
        (grafanaUser) => 
          grafanaUser.email.toLowerCase() === user.email.toLowerCase() ||
          grafanaUser.login.toLowerCase() === user.username.toLowerCase()
      );
      
      if (matchedGrafanaUser) {
        console.log(`Found Grafana user mapping: ${matchedGrafanaUser.email} -> ID ${matchedGrafanaUser.id}`);
        setEffectiveGrafanaUserId(matchedGrafanaUser.id);
        return;
      }
    }

    // Priority 3: If we have a user but no mapping, try to sync organization users
    if (user?.organization && organizationUsers.length === 0) {
      console.log('No organization users found, triggering sync...');
      syncUsers();
    }
  }, [user?.grafanaUserId, user?.email, user?.username, user?.organization, organizationUsers, syncUsers]);

  useEffect(() => {
    // Fetch dashboards and folders based on user's folder permissions
    if (effectiveGrafanaUserId) {
      console.log(`Fetching dashboards and folders for Grafana user ID: ${effectiveGrafanaUserId}`);
      fetchUserDashboards(effectiveGrafanaUserId);
      fetchUserFolders(effectiveGrafanaUserId);
    }
  }, [effectiveGrafanaUserId, fetchUserDashboards, fetchUserFolders]);

  // Set the first folder as default when folders are loaded
  useEffect(() => {
    if (folders.length > 0 && !selectedFolder) {
      setSelectedFolder(folders[0].uid);
    }
  }, [folders, selectedFolder]);

  const handleFolderChange = (folderUid: string): void => {
    setSelectedFolder(folderUid);
  };

  const handleViewDashboard = (dashboard: Dashboard): void => {
    setSelectedDashboard(dashboard);
    setViewMode('viewer');
  };

  const handleDeleteClick = (dashboard: Dashboard): void => {
    setDashboardToDelete(dashboard);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (dashboardToDelete) {
      try {
        const response = await fetch(`/api/grafana/dashboards/${dashboardToDelete.uid}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsDeleteDialogOpen(false);
          setDashboardToDelete(null);
          
          if (selectedDashboard?.uid === dashboardToDelete.uid) {
            setSelectedDashboard(null);
            setViewMode('grid');
          }
        }
      } catch (error) {
        console.error('Failed to delete dashboard:', error);
      }
    }
  };

  const displayDashboards = dashboards
    .filter((dashboard: Dashboard) =>
      dashboard.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((dashboard: Dashboard) => 
      !selectedFolder || dashboard.folderUid === selectedFolder
    );

  const isLoading = dashboardsLoading || foldersLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Dashboards</h1>
          <p className="text-muted-foreground">
            View dashboards from folders you have access to
          </p>
        </div>
        <div className="flex gap-2">
          {viewMode === 'viewer' && activeTab === 'browse' && (
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('grid');
                setSelectedDashboard(null);
              }}
            >
              <Grid className="mr-2 h-4 w-4" />
              Back to Grid
            </Button>
          )}
        </div>
      </div>

      {!effectiveGrafanaUserId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          <div>
            <p className="font-medium">Grafana User Mapping Required</p>
            <p className="mt-1">
              {user?.grafanaUserId === undefined ? (
                <>
                  Your Grafana user account is being automatically configured for organization <strong>{user?.organization}</strong>.
                  {organizationUsers.length > 0 ? (
                    <> We found {organizationUsers.length} Grafana users in your organization. If your account is not automatically linked, please contact your administrator.</>
                  ) : (
                    <> Please wait while we sync organization users, or try refreshing the page.</>
                  )}
                </>
              ) : (
                <>Unable to find your Grafana user mapping. Please ensure you have been added to Grafana or contact your administrator.</>
              )}
            </p>
            {organizationUsers.length > 0 && !effectiveGrafanaUserId && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => syncUsers()}
                  className="text-xs"
                >
                  Retry Sync
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* {effectiveGrafanaUserId && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <p>
              Grafana User ID: <strong>{effectiveGrafanaUserId}</strong> - Showing dashboards from folders you have access to
            </p>
          </div>
        </div>
      )} */}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'panels' | 'browse')}>
        <TabsList>
          <TabsTrigger value="panels" className='px-6 py-4'>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Dashboard Panels
          </TabsTrigger>
          <TabsTrigger value="browse" className='px-6 py-4'>
            <Grid className="mr-2 h-4 w-4" />
            Browse All
          </TabsTrigger>
        </TabsList>

        <TabsContent value="panels" className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Live dashboard panels with auto-refresh
          </div>
          <DashboardPanelGrid 
            panels={DASHBOARD_PANELS} 
            columns={2}
            defaultHeight={300}
          />
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          {viewMode === 'grid' && (
            <>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search dashboards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={selectedFolder} onValueChange={handleFolderChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.uid} value={folder.uid}>
                        {folder.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading dashboards from accessible folders...
                </div>
              ) : !effectiveGrafanaUserId ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please configure your Grafana user mapping to view dashboards.
                </div>
              ) : displayDashboards.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">
                    No dashboards found in your accessible folders.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your Grafana User ID: <strong>{effectiveGrafanaUserId}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {folders.length > 0 ? (
                      <>You have access to {folders.length} folder(s), but they contain no dashboards.</>
                    ) : (
                      <>You don&apos;t have access to any folders yet. Contact your administrator to grant folder permissions.</>
                    )}
                  </p>
                </div>
              ) : (
                <DashboardGrid
                  dashboards={displayDashboards}
                  onView={handleViewDashboard}
                  onDelete={handleDeleteClick}
                />
              )}
            </>
          )}

          {viewMode === 'viewer' && selectedDashboard && (
            <DashboardViewer
              dashboardUid={selectedDashboard.uid}
              title={selectedDashboard.title}
            />
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the dashboard &quot;{dashboardToDelete?.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MyDashboardsPage;
