'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layout, ArrowLeft, FolderOpen } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="h-9 sm:h-10 md:!h-11 px-3 sm:px-4 md:px-6 text-xs sm:text-sm border-input hover:bg-accent rounded-lg border-0 shadow-none"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Folders
          </Button>
        </div>
      </div>

      <Card className='border-0 shadow-none'>
        <CardHeader className="p-3 sm:p-4 md:!px-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl !px-0">
            <Layout className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Dashboards in &quot;{folder.title}&quot;</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage which dashboards are in this folder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-0">
          {/* Add Dashboard Section */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:grid md:grid-cols-12 md:gap-4">
            <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
              <SelectTrigger className="flex-1 h-9 sm:h-10 md:!h-11 text-xs sm:text-sm border-input rounded-lg focus:ring-2 focus:ring-ring col-span-10">
                <SelectValue placeholder="Select a dashboard to add" />
              </SelectTrigger>
              <SelectContent>
                {availableDashboards.length === 0 ? (
                  <div className="p-2 text-xs sm:text-sm text-muted-foreground">
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
              className="h-9 sm:h-10 md:!h-11 px-4 sm:px-5 md:px-6 text-xs sm:text-sm bg-primary hover:bg-blue-700 text-white font-medium rounded-lg w-full sm:w-auto whitespace-nowrap col-span-2"
            >
              {movingDashboard === selectedDashboard ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <>
                  Add
                </>
              )}
            </Button>
          </div>

          {/* Current Dashboards */}
          <div>
            <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Dashboards in this Folder</h3>
            {loading ? (
              <div className="flex justify-center py-6 sm:py-8">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              </div>
            ) : folderDashboards.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  No dashboards in this folder
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add dashboards above to populate this folder
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {folderDashboards.map((dashboard) => (
                  <Card key={dashboard.uid} className="card-widget hover:shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="!text-xs font-medium text-muted-foreground uppercase tracking-wide flex justify-between items-center">
                        Dashboard
                        <Badge 
                          variant="secondary"
                          className="text-[10px] sm:text-xs px-2 py-0.5"
                        >
                          {folder.title}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col justify-between min-h-[200px]">
                      <div>
                        <div className="text-l font-bold text-foreground mb-1 line-clamp-2">
                          {dashboard.title}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                          UID: {dashboard.uid}
                        </div>
                        {dashboard.tags && dashboard.tags.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {dashboard.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0.5">
                                  {tag}
                                </Badge>
                              ))}
                              {dashboard.tags.length > 4 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                  +{dashboard.tags.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 mt-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                            Change Folder:
                          </span>
                          <Select
                            onValueChange={(value) => handleMoveDashboard(dashboard.uid, value)}
                            disabled={movingDashboard === dashboard.uid}
                          >
                            <SelectTrigger className="w-full h-9 sm:h-10 md:h-11 text-xs sm:text-sm border-input rounded-lg focus:ring-2 focus:ring-ring">
                              <SelectValue placeholder="Select destination folder" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__general__">General</SelectItem>
                              {folders
                                .filter((f) => f.uid !== folder.uid)
                                .map((f) => (
                                  <SelectItem key={f.uid} value={f.uid}>
                                    {f.title}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {movingDashboard === dashboard.uid && (
                          <div className="flex justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
