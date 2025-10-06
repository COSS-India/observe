'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { CheckCircle, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { organizationUsers, syncUsers, loading } = useOrganizationUsers();
  const [mappedGrafanaUser, setMappedGrafanaUser] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Try to find the mapped Grafana user
    if (user?.email && organizationUsers.length > 0) {
      const matchedUser = organizationUsers.find(
        (grafanaUser) => 
          grafanaUser.email.toLowerCase() === user.email.toLowerCase() ||
          grafanaUser.login.toLowerCase() === user.username.toLowerCase()
      );
      setMappedGrafanaUser(matchedUser?.id);
    }
  }, [user?.email, user?.username, organizationUsers]);

  const effectiveGrafanaUserId = user?.grafanaUserId || mappedGrafanaUser;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Manage your application settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grafana Integration</CardTitle>
          <CardDescription>
            Your Grafana user ID is automatically configured based on your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {effectiveGrafanaUserId ? (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Grafana Integration Active</p>
                <p className="mt-1">
                  Your Grafana user ID is <strong>{effectiveGrafanaUserId}</strong>
                  {user?.grafanaUserId && mappedGrafanaUser && user.grafanaUserId !== mappedGrafanaUser && (
                    <> (Login ID: {user.grafanaUserId}, Mapped ID: {mappedGrafanaUser})</>
                  )}
                  {!user?.grafanaUserId && mappedGrafanaUser && (
                    <> (found via organization user mapping)</>
                  )}
                  {user?.grafanaUserId && !mappedGrafanaUser && (
                    <> (configured during login)</>
                  )}
                  . Organization: <strong>{user?.organization}</strong>
                </p>
                <p className="mt-2 text-xs">
                  You have access to dashboards based on your folder permissions in Grafana.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Grafana Integration Pending</p>
                <p className="mt-1">
                  Your Grafana user ID will be automatically configured on your next login. 
                  The system will create your organization (<strong>{user?.organization}</strong>) and user account in Grafana if they don&apos;t exist.
                </p>
                {organizationUsers.length > 0 && (
                  <div className="mt-3">
                    <Button 
                      onClick={syncUsers} 
                      disabled={loading}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Retry User Mapping
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm">Grafana User Mapping Status:</h4>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${user?.grafanaUserId ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-muted-foreground">
                  Login-based ID: {user?.grafanaUserId ? <strong>{user.grafanaUserId}</strong> : 'Not set'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${mappedGrafanaUser ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-muted-foreground">
                  Organization mapping: {mappedGrafanaUser ? <strong>{mappedGrafanaUser}</strong> : 'Not found'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {organizationUsers.length} Grafana user(s) in your organization
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm">How automatic integration works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>System automatically finds or creates your Grafana organization (<strong>{user?.organization}</strong>)</li>
              <li>Automatically creates your user account in Grafana if needed</li>
              <li>Adds you to your organization with appropriate permissions</li>
              <li>You immediately see only dashboards from folders you have access to</li>
            </ol>
            <p className="text-sm text-muted-foreground pt-2">
              Everything happens automatically during login - no manual configuration needed!
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Your current portal account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Username:</dt>
              <dd className="font-medium">{user?.username || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email:</dt>
              <dd className="font-medium">{user?.email || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Role:</dt>
              <dd className="font-medium capitalize">{user?.role || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Organization:</dt>
              <dd className="font-medium">{user?.organization || 'N/A'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
