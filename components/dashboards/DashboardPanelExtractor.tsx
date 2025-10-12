'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Panel {
  id: number;
  title: string;
  type: string;
}

interface DashboardPanelExtractorProps {
  folders: Array<{ uid: string; title: string }>;
  dashboards: Array<{ uid: string; title: string; folderUid: string }>;
  organizationName?: string;
}

const TIME_RANGES = [
  { label: 'Last 5 minutes', value: 'now-5m', from: 'now-5m', to: 'now' },
  { label: 'Last 15 minutes', value: 'now-15m', from: 'now-15m', to: 'now' },
  { label: 'Last 30 minutes', value: 'now-30m', from: 'now-30m', to: 'now' },
  { label: 'Last 1 hour', value: 'now-1h', from: 'now-1h', to: 'now' },
  { label: 'Last 3 hours', value: 'now-3h', from: 'now-3h', to: 'now' },
  { label: 'Last 6 hours', value: 'now-6h', from: 'now-6h', to: 'now' },
  { label: 'Last 12 hours', value: 'now-12h', from: 'now-12h', to: 'now' },
  { label: 'Last 24 hours', value: 'now-24h', from: 'now-24h', to: 'now' },
  { label: 'Last 2 days', value: 'now-2d', from: 'now-2d', to: 'now' },
  { label: 'Last 7 days', value: 'now-7d', from: 'now-7d', to: 'now' },
  { label: 'Last 30 days', value: 'now-30d', from: 'now-30d', to: 'now' },
  { label: 'Last 90 days', value: 'now-90d', from: 'now-90d', to: 'now' },
  { label: 'Last 6 months', value: 'now-6M', from: 'now-6M', to: 'now' },
  { label: 'Last 1 year', value: 'now-1y', from: 'now-1y', to: 'now' },
  { label: 'Last 2 years', value: 'now-2y', from: 'now-2y', to: 'now' },
  { label: 'Today', value: 'now/d', from: 'now/d', to: 'now' },
  { label: 'Yesterday', value: 'now-1d/d', from: 'now-1d/d', to: 'now-1d/d' },
  { label: 'This week', value: 'now/w', from: 'now/w', to: 'now' },
  { label: 'Last week', value: 'now-1w/w', from: 'now-1w/w', to: 'now-1w/w' },
  { label: 'This month', value: 'now/M', from: 'now/M', to: 'now' },
  { label: 'Last month', value: 'now-1M/M', from: 'now-1M/M', to: 'now-1M/M' },
];

export function DashboardPanelExtractor({ folders, dashboards, organizationName }: DashboardPanelExtractorProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedDashboard, setSelectedDashboard] = useState<string>('');
  const [panels, setPanels] = useState<Panel[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('now-6h');
  const [loading, setLoading] = useState(false);

  const filteredDashboards = dashboards.filter(
    (d) => !selectedFolder || d.folderUid === selectedFolder
  );

  // Set default folder when folders are loaded
  useEffect(() => {
    if (folders.length > 0 && !selectedFolder) {
      setSelectedFolder(folders[0].uid);
    }
  }, [folders, selectedFolder]);

  // Set default dashboard when folder changes or when dashboards load
  useEffect(() => {
    const filtered = dashboards.filter(
      (d) => !selectedFolder || d.folderUid === selectedFolder
    );
    
    if (filtered.length > 0) {
      // Check if current selection is still valid in filtered list
      const isCurrentValid = filtered.some(d => d.uid === selectedDashboard);
      
      if (!isCurrentValid) {
        // Only set to first if current selection is not in the filtered list
        setSelectedDashboard(filtered[0].uid);
      }
    } else {
      setSelectedDashboard('');
    }
  }, [selectedFolder, dashboards, selectedDashboard]);

  const fetchDashboardPanels = useCallback(async (dashboardUid: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/grafana/dashboards/${dashboardUid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }
      const data = await response.json();
      
      // Extract panels from dashboard JSON
      const dashboardPanels = data.dashboard?.panels || [];
      const extractedPanels: Panel[] = [];
      const seenPanelIds = new Set<number>(); // Track panel IDs to avoid duplicates

      // In Grafana, panels are in a flat array
      // Row panels (type: 'row') are just organizational and should be skipped
      // Text panels (type: 'text') are markdown/HTML headers and cannot be embedded
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dashboardPanels.forEach((panel: any) => {
        // Skip row panels, text panels, and panels without IDs
        if (panel.type === 'row' || panel.type === 'text' || panel.id === undefined) {
          return;
        }
        
        // Skip if we've already seen this panel ID (avoid duplicates)
        if (seenPanelIds.has(panel.id)) {
          return;
        }
        
        // Add regular embeddable panels (stat, gauge, timeseries, piechart, etc.)
        seenPanelIds.add(panel.id);
        extractedPanels.push({
          id: panel.id,
          title: panel.title || `Panel ${panel.id}`,
          type: panel.type || 'unknown',
        });
      });

      setPanels(extractedPanels);
      console.log(`Extracted ${extractedPanels.length} unique panels from dashboard`);
    } catch (error) {
      console.error('Error fetching dashboard panels:', error);
      toast.error('Failed to load dashboard panels');
      setPanels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDashboard) {
      fetchDashboardPanels(selectedDashboard);
    } else {
      setPanels([]);
    }
  }, [selectedDashboard, fetchDashboardPanels]);

  return (
    <div className="space-xl w-full">
      {/* All Filters in Single Row */}
      <Card className="card-widget overflow-hidden border-0 !shadow-none !p-0">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 items-center">
            {/* Folder Selector */}
            <div className="space-tight">
              <label className="text-body font-medium text-foreground mb-3">
                Folder
              </label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-full !h-12 text-body border-input rounded-lg">
                  <SelectValue className="text-body" placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem className="text-body" key={folder.uid} value={folder.uid}>
                      {folder.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dashboard Selector */}
            <div className="space-tight">
              <label className="text-body font-medium text-foreground mb-3">
                Dashboard
              </label>
              <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
                <SelectTrigger className="w-full !h-12 text-body border-input rounded-lg">
                  <SelectValue className="text-body" placeholder="Select a dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDashboards.length === 0 ? (
                    <div className="p-2 text-body text-muted-foreground">
                      No dashboards available
                    </div>
                  ) : (
                    filteredDashboards.map((dashboard) => (
                      <SelectItem className="text-body" key={dashboard.uid} value={dashboard.uid}>
                        {dashboard.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Time Range Selector */}
            <div className="space-tight">
              <label className="text-body font-medium text-foreground mb-3">
                Time Range
              </label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-full !h-12 text-body border-input rounded-lg">
                  <SelectValue className="text-body" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((range) => (
                    <SelectItem className="text-body" key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-body text-muted-foreground">Loading panels...</span>
        </div>
      )}

      {!loading && selectedDashboard && panels.length === 0 && (
        <div className="text-center py-8 text-body text-muted-foreground">
          No panels found in this dashboard
        </div>
      )}

      {!loading && panels.length > 0 && (
        <div className="space-normal">
          {/* <div className="text-body text-muted-foreground">
            Found {panels.length} panel{panels.length !== 1 ? 's' : ''} in this dashboard
          </div> */}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {panels.map((panel) => {
              // For Grafana d-solo URLs, the UID is often the slug itself
              // Use the UID as both the identifier and slug
              const dashboardUid = selectedDashboard;
              
              // Construct URL - use UID as slug (common in Grafana)
              const baseUrl = `${process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3000'}/d-solo/${dashboardUid}/${dashboardUid}`;
              
              const params = new URLSearchParams({
                from: TIME_RANGES.find(r => r.value === selectedTimeRange)?.from || 'now-6h',
                to: TIME_RANGES.find(r => r.value === selectedTimeRange)?.to || 'now',
                timezone: 'browser',
                refresh: '30s',
                panelId: panel.id.toString(),
              });
              
              // Pass organization name as customer variable
              if (organizationName) {
                params.set('var-customer', organizationName);
              }
              params.set('var-app', '$__all');
              
              const iframeSrc = `${baseUrl}?${params.toString()}`;
              console.log("iframe", iframeSrc, "panel:", panel.id, panel.title);
              return (
                <Card key={panel.id} className="card-widget overflow-hidden">
                  <CardHeader className="p-6 bg-muted/30">
                    <CardTitle className="text-card-title">
                      <span className="truncate">
                        {panel.title}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-t border-gray-200 dark:border-gray-700 overflow-hidden">
                      <iframe
                        src={iframeSrc}
                        width="100%"
                        height="400"
                        frameBorder="0"
                        title={`${panel.title} Preview`}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
