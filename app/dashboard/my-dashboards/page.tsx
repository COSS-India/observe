'use client';

import React, { useEffect, useState } from 'react';
import { Grid, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardGrid } from '@/components/dashboards/DashboardGrid';
import { DashboardViewer } from '@/components/dashboards/DashboardViewer';
import { DashboardPanelGrid, type PanelConfig } from '@/components/dashboards/DashboardPanelGrid';
import { useUserDashboardMapping } from '@/hooks/useUserDashboardMapping';
import { useGrafanaFolders } from '@/hooks/useGrafanaFolders';
import type { Dashboard } from '@/types/grafana';
import { Badge } from '@/components/ui/badge';
import { Building2, Users } from 'lucide-react';
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
  const { 
    filteredDashboards,
    filteredFolders,
    isLoading: mappingLoading, 
    isReady,
    userOrganization,
    userTeams 
  } = useUserDashboardMapping();
  const { fetchFolders } = useGrafanaFolders();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'viewer'>('grid');
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<Dashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'panels' | 'browse'>('panels');

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

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

  const displayDashboards = filteredDashboards
    .filter((dashboard) =>
      dashboard.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((dashboard) => 
      selectedFolder === 'all' || dashboard.folderUid === selectedFolder
    );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Dashboards</h1>
          <p className="text-muted-foreground">
            View and manage your Grafana dashboards
          </p>
          {isReady && userOrganization && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {userOrganization.name}
              </Badge>
              {userTeams.map(team => (
                <Badge key={team.id} variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {team.name}
                </Badge>
              ))}
            </div>
          )}
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'panels' | 'browse')}>
        <TabsList>
          <TabsTrigger value="panels">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Dashboard Panels
          </TabsTrigger>
          <TabsTrigger value="browse">
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
                    <SelectValue placeholder="All Folders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Folders</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.uid} value={folder.uid}>
                        {folder.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mappingLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading your dashboards...
                </div>
              ) : displayDashboards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No dashboards found. Try adjusting your filters.
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
