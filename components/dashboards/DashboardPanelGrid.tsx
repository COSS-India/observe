'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export interface PanelConfig {
  id: string;
  title: string;
  src: string;
  width?: number;
  height?: number;
}

interface DashboardPanelGridProps {
  panels: PanelConfig[];
  columns?: 1 | 2 | 3 | 4;
  defaultHeight?: number;
}

export function DashboardPanelGrid({ 
  panels, 
  columns = 2,
  defaultHeight = 400 
}: DashboardPanelGridProps) {
  const [fullscreenPanel, setFullscreenPanel] = useState<string | null>(null);

  const toggleFullscreen = (panelId: string) => {
    if (fullscreenPanel === panelId) {
      setFullscreenPanel(null);
    } else {
      setFullscreenPanel(panelId);
    }
  };

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  // If a panel is in fullscreen mode, only show that panel
  const displayPanels = fullscreenPanel 
    ? panels.filter(p => p.id === fullscreenPanel)
    : panels;

  const fullscreenGridClass = fullscreenPanel ? 'grid-cols-1' : gridColsClass;

  return (
    <div className={`grid ${fullscreenGridClass} gap-6`}>
      {displayPanels.map((panel) => {
        const isFullscreen = fullscreenPanel === panel.id;
        const panelHeight = isFullscreen ? 'calc(100vh - 250px)' : `${panel.height || defaultHeight}px`;

        return (
          <Card key={panel.id} className="overflow-hidden p-0 shadow-sm">
            {/* <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">
                  {panel.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleFullscreen(panel.id)}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader> */}
            <CardContent className="p-0">
              <iframe
                src={panel.src}
                width="100%"
                height={panelHeight}
                frameBorder="0"
                className="border-0"
                title={panel.title}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
