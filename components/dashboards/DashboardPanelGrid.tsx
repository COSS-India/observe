'use client';

import { Card, CardContent } from '@/components/ui/card';
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
  organizationName?: string;
}

export function DashboardPanelGrid({ 
  panels, 
  columns = 2,
  defaultHeight = 400,
  organizationName 
}: DashboardPanelGridProps) {
  const [fullscreenPanel] = useState<string | null>(null);

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  // If a panel is in fullscreen mode, only show that panel
  const displayPanels = fullscreenPanel 
    ? panels.filter(p => p.id === fullscreenPanel)
    : panels;

  const fullscreenGridClass = fullscreenPanel ? 'grid-cols-1' : gridColsClass;

  // Helper function to append organization parameter to iframe src
  const getIframeSrc = (src: string) => {
    if (!organizationName) return src;
    const url = new URL(src);
    url.searchParams.set('var-organization', organizationName);
    return url.toString();
  };

  return (
    <div className={`grid ${fullscreenGridClass} gap-3 sm:gap-4 md:gap-6 w-full`}>
      {displayPanels.map((panel) => {
        const isFullscreen = fullscreenPanel === panel.id;
        const panelHeight = isFullscreen 
          ? 'calc(100vh - 200px)' 
          : window.innerWidth < 640 
            ? `${(panel.height || defaultHeight) * 0.8}px` 
            : `${panel.height || defaultHeight}px`;

        return (
          <Card key={panel.id} className="overflow-hidden p-0 shadow-sm w-full">
            <CardContent className="p-0 w-full">
              <div className="w-full overflow-hidden">
                <iframe
                  src={getIframeSrc(panel.src)}
                  width="100%"
                  height={panelHeight}
                  frameBorder="0"
                  className="border-0 w-full"
                  title={panel.title}
                  style={{ minHeight: '250px' }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
