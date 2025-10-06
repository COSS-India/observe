'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Layout, Shield, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function FolderManagementGuide() {
  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Folder Management Guide
        </CardTitle>
        <CardDescription>
          Quick reference for managing folders, teams, and dashboards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-blue-500" />
              Team Access
            </div>
            <p className="text-sm text-muted-foreground">
              Click the <Users className="inline h-3 w-3" /> icon to manage which teams can access a folder.
            </p>
            <div className="space-y-1 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary">View</Badge>
                <span className="text-muted-foreground">Read-only access</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="default">Edit</Badge>
                <span className="text-muted-foreground">Can modify dashboards</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="destructive">Admin</Badge>
                <span className="text-muted-foreground">Full control</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Layout className="h-4 w-4 text-green-500" />
              Dashboard Organization
            </div>
            <p className="text-sm text-muted-foreground">
              Click the <Layout className="inline h-3 w-3" /> icon to add or move dashboards within a folder.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 pt-2">
              <li>• Add dashboards from dropdown</li>
              <li>• Move between folders easily</li>
              <li>• View all folder contents</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Shield className="h-4 w-4 text-purple-500" />
              Best Practices
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Grant minimal required permissions</li>
              <li>• Use descriptive folder names</li>
              <li>• Group related dashboards together</li>
              <li>• Review access periodically</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
