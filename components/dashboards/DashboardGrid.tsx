'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, FolderOpen } from 'lucide-react';
import type { Dashboard } from '@/types/grafana';

interface DashboardGridProps {
  dashboards: Dashboard[];
  onView: (dashboard: Dashboard) => void;
  onDelete: (dashboard: Dashboard) => void;
}

export function DashboardGrid({ dashboards, onView, onDelete }: DashboardGridProps) {
  if (dashboards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No dashboards found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dashboards.map((dashboard) => (
        <Card key={dashboard.uid} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="line-clamp-1">{dashboard.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground space-y-1">
                {dashboard.folderTitle && (
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-3 w-3" />
                    <span>{dashboard.folderTitle}</span>
                  </div>
                )}
                {dashboard.tags && dashboard.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dashboard.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-muted rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {dashboard.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs">
                        +{dashboard.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onView(dashboard)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(dashboard)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
