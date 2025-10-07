"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, FolderOpen } from "lucide-react";
import type { Dashboard } from "@/types/grafana";
import { isSuperAdmin } from "@/lib/utils/permissions";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "../ui/badge";

interface DashboardGridProps {
  dashboards: Dashboard[];
  onView: (dashboard: Dashboard) => void;
  onDelete: (dashboard: Dashboard) => void;
}

export function DashboardGrid({
  dashboards,
  onView,
  onDelete,
}: DashboardGridProps) {
  const { user } = useAuth();

  if (dashboards.length === 0) {
    return (
      <div className="text-center py-16 text-body text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p>No dashboards found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {dashboards.map((dashboard) => (
        <Card key={dashboard.uid} className="card-widget hover:shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="!text-xs font-medium text-muted-foreground uppercase tracking-wide flex justify-between items-center">
              Dashboard
              <p className="text-body font-medium text-muted-foreground">
                {dashboard.folderTitle || "General"}
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col justify-between min-h-[200px]">
            <div>
              <div className="text-l font-bold text-foreground mb-1 line-clamp-2">
                {dashboard.title}
              </div>
            </div>
            <div>
              {dashboard.tags && dashboard.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {dashboard.tags.slice(0, 4).map((tag) => (
                      <div key={tag} className="">
                        <Badge className="" variant="outline">{tag}</Badge>
                      </div>
                    ))}
                    {dashboard.tags.length > 4 && (
                      <div className="">
                        <Badge className="" variant="outline">+{dashboard.tags.length - 4}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <Button
                  size="sm"
                  className="flex-1 h-10 text-body rounded-lg text-white"
                  onClick={() => onView(dashboard)}
                >
                  <Eye className="h-4 w-4 mr-2 text-white" />
                  View
                </Button>
                {isSuperAdmin(user) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-4 border-border hover:bg-accent rounded-lg"
                    onClick={() => onDelete(dashboard)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
