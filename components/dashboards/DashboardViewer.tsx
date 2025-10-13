'use client';

import { useState } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { DashboardEmbedConfig } from '@/types/grafana';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Maximize2, Minimize2 } from 'lucide-react';

interface DashboardViewerProps {
  dashboardUid: string;
  title?: string;
  organizationName?: string;
}

export function DashboardViewer({ dashboardUid, title, organizationName }: DashboardViewerProps) {
  const [config, setConfig] = useState<DashboardEmbedConfig>({
    uid: dashboardUid,
    theme: 'dark',
    kiosk: true,
    refresh: '5s',
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const embedUrl = grafanaAPI.generateEmbedUrl(config, organizationName);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`space-y-3 sm:space-y-4 w-full overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-2 sm:p-4' : ''}`}>
      {/* Controls */}
      <Card className="p-2 sm:p-3 md:p-4 overflow-x-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-6 w-full min-w-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="theme" className="text-xs sm:text-sm whitespace-nowrap">Theme</Label>
              <Select
                value={config.theme}
                onValueChange={(value: 'light' | 'dark') =>
                  setConfig({ ...config, theme: value })
                }
              >
                <SelectTrigger id="theme" className="w-full sm:w-[100px] md:w-[120px] h-9 sm:h-10 md:h-11 text-xs sm:text-sm border-input rounded-lg focus:ring-2 focus:ring-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <Label htmlFor="kiosk" className="text-xs sm:text-sm whitespace-nowrap">Kiosk Mode</Label>
              <Switch
                id="kiosk"
                checked={config.kiosk}
                onCheckedChange={(checked: boolean) =>
                  setConfig({ ...config, kiosk: checked })
                }
              />
            </div>

            {/* <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="refresh" className="text-xs sm:text-sm whitespace-nowrap">Auto Refresh</Label>
              <Select
                value={config.refresh || 'none'}
                onValueChange={(value) =>
                  setConfig({ ...config, refresh: value === 'none' ? undefined : value })
                }
              >
                <SelectTrigger id="refresh" className="w-full sm:w-[100px] md:w-[120px] h-9 sm:h-10 md:h-11 text-xs sm:text-sm border-input rounded-lg focus:ring-2 focus:ring-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="5s">5 seconds</SelectItem>
                  <SelectItem value="10s">10 seconds</SelectItem>
                  <SelectItem value="30s">30 seconds</SelectItem>
                  <SelectItem value="1m">1 minute</SelectItem>
                  <SelectItem value="5m">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>

          {/* <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 flex-shrink-0"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button> */}
        </div>
      </Card>

      {/* Dashboard iframe */}
      <Card className={`overflow-hidden w-full ${isFullscreen ? 'flex-1' : ''}`}>
        {title && (
          <div className="px-3 py-2 sm:px-4 sm:py-3 border-b bg-muted/50">
            <h3 className="font-semibold text-sm sm:text-base truncate">{title}</h3>
          </div>
        )}
        <div className={`w-full ${isFullscreen ? 'h-[calc(100%-50px)] sm:h-[calc(100%-60px)]' : 'h-[400px] sm:h-[500px] md:h-[600px]'}`}>
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={title || 'Grafana Dashboard'}
            allowFullScreen
          />
        </div>
      </Card>
    </div>
  );
}
