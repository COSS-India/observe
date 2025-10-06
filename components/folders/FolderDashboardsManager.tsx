'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layout, MoveRight } from 'lucide-react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { DashboardFolder, Dashboard } from '@/types/grafana';
import { toast } from 'sonner';
import axios from 'axios';

interface FolderDashboardsManagerProps {
  folder: DashboardFolder;
  onBack: () => void;
}

export function FolderDashboardsManager({ folder, onBack }: FolderDashboardsManagerProps) {
  const [allDashboards, setAllDashboards] = useState<Dashboard[]>([]);
  const [folderDashboards, setFolderDashboards] = useState<Dashboard[]>([]);
  const [folders, setFolders] = useState<DashboardFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingDashboard, setMovingDashboard] = useState<string | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<string>('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder.uid]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboards, foldersData] = await Promise.all([
        grafanaAPI.listDashboards(),
        grafanaAPI.listFolders(),
      ]);
      
      setAllDashboards(dashboards);
      setFolderDashboards(dashboards.filter((d) => d.folderUid === folder.uid));
      setFolders(foldersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDashboard = async () => {
    if (!selectedDashboard) {
      toast.error('Please select a dashboard');
      return;
    }

    setMovingDashboard(selectedDashboard);
    try {
      await axios.post(`/api/grafana/dashboards/${selectedDashboard}/move`, {
        folderUid: folder.uid,
      });

      toast.success('Dashboard added to folder');
      setSelectedDashboard('');
      await fetchData();
    } catch (error) {
      console.error('Error adding dashboard:', error);
      toast.error('Failed to add dashboard to folder');
    } finally {
      setMovingDashboard(null);
    }
  };

  const handleMoveDashboard = async (dashboardUid: string, targetFolderUid: string) => {
    setMovingDashboard(dashboardUid);
    try {
      // Convert special "general" value to empty string for Grafana API
      const actualFolderUid = targetFolderUid === '__general__' ? '' : targetFolderUid;
      
      await axios.post(`/api/grafana/dashboards/${dashboardUid}/move`, {
        folderUid: actualFolderUid,
      });

      toast.success('Dashboard moved');
      await fetchData();
    } catch (error) {
      console.error('Error moving dashboard:', error);
      toast.error('Failed to move dashboard');
    } finally {
      setMovingDashboard(null);
    }
  };

  const availableDashboards = allDashboards.filter(
    (d) => d.folderUid !== folder.uid
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack}>
            ← Back to Folders
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Dashboards in &quot;{folder.title}&quot;
          </CardTitle>
          <CardDescription>
            Manage which dashboards are in this folder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Dashboard Section */}
          <div className="flex gap-4">
            <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a dashboard to add" />
              </SelectTrigger>
              <SelectContent>
                {availableDashboards.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No dashboards available
                  </div>
                ) : (
                  availableDashboards.map((dashboard) => (
                    <SelectItem key={dashboard.uid} value={dashboard.uid}>
                      {dashboard.title} {dashboard.folderTitle && `(in ${dashboard.folderTitle})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAddDashboard}
              disabled={movingDashboard !== null || !selectedDashboard}
            >
              {movingDashboard === selectedDashboard ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <MoveRight className="mr-2 h-4 w-4" />
                  Add to Folder
                </>
              )}
            </Button>
          </div>

          {/* Current Dashboards */}
          <div>
            <h3 className="text-sm font-medium mb-3">Dashboards in this Folder</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : folderDashboards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No dashboards in this folder yet
              </div>
            ) : (
              <div className="space-y-2">
                {folderDashboards.map((dashboard) => (
                  <div
                    key={dashboard.uid}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Layout className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{dashboard.title}</div>
                        <div className="text-sm text-muted-foreground">
                          UID: {dashboard.uid}
                        </div>
                      </div>
                      {dashboard.tags && dashboard.tags.length > 0 && (
                        <div className="flex gap-1">
                          {dashboard.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={dashboard.folderUid || '__general__'}
                        onValueChange={(value) => handleMoveDashboard(dashboard.uid, value)}
                        disabled={movingDashboard === dashboard.uid}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__general__">General (No Folder)</SelectItem>
                          {folders
                            .filter((f) => f.uid !== folder.uid)
                            .map((f) => (
                              <SelectItem key={f.uid} value={f.uid}>
                                {f.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {movingDashboard === dashboard.uid && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
