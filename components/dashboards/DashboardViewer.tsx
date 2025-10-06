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
}

export function DashboardViewer({ dashboardUid, title }: DashboardViewerProps) {
  const [config, setConfig] = useState<DashboardEmbedConfig>({
    uid: dashboardUid,
    theme: 'dark',
    kiosk: true,
    refresh: '5s',
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const embedUrl = grafanaAPI.generateEmbedUrl(config);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
      {/* Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={config.theme}
                onValueChange={(value: 'light' | 'dark') =>
                  setConfig({ ...config, theme: value })
                }
              >
                <SelectTrigger id="theme" className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="kiosk">Kiosk Mode</Label>
              <Switch
                id="kiosk"
                checked={config.kiosk}
                onCheckedChange={(checked: boolean) =>
                  setConfig({ ...config, kiosk: checked })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="refresh">Auto Refresh</Label>
              <Select
                value={config.refresh || 'none'}
                onValueChange={(value) =>
                  setConfig({ ...config, refresh: value === 'none' ? undefined : value })
                }
              >
                <SelectTrigger id="refresh" className="w-[120px]">
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
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Dashboard iframe */}
      <Card className={`overflow-hidden ${isFullscreen ? 'flex-1' : ''}`}>
        {title && (
          <div className="px-4 py-3 border-b bg-muted/50">
            <h3 className="font-semibold">{title}</h3>
          </div>
        )}
        <div className={`${isFullscreen ? 'h-[calc(100%-60px)]' : 'h-[600px]'}`}>
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
