'use client';

import { useState, useEffect } from 'react';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useUserTeams } from '@/hooks/useUserTeams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw, Users, Clock, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';

function UserTeamsList({ userId }: { userId: number }) {
  const { teams, loading, fetchUserTeams } = useUserTeams(userId);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded && teams.length === 0 && !loading) {
      fetchUserTeams();
    }
  }, [expanded, teams.length, loading, fetchUserTeams]);

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className="h-7 px-2 text-xs"
      >
        <Users className="h-3 w-3 mr-1" />
        Show Teams
        <ChevronRight className="h-3 w-3 ml-1" />
      </Button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Loading teams...
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
          className="h-7 px-2 text-xs"
        >
          <ChevronDown className="h-3 w-3 mr-1" />
          Hide
        </Button>
        <span className="text-xs text-muted-foreground">No teams</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(false)}
        className="h-7 px-2 text-xs"
      >
        <ChevronDown className="h-3 w-3 mr-1" />
        Hide
      </Button>
      {teams.map((team) => (
        <Badge key={team.id} variant="outline" className="text-xs">
          {team.name}
        </Badge>
      ))}
    </div>
  );
}

export function FilteredUsersDisplay() {
  const {
    organizationUsers,
    loading,
    error,
    userOrganization,
    syncUsers,
    forceRefresh,
    clearUsers,
    getUsersCount,
    getLastSyncDate,
    needsSync
  } = useOrganizationUsers();

  const lastSync = getLastSyncDate();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Users</h2>
          <p className="text-muted-foreground">
            Grafana users filtered by organization: <strong>{userOrganization}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={syncUsers}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Users
          </Button>
          <Button
            onClick={forceRefresh}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Force Refresh
          </Button>
          <Button
            onClick={clearUsers}
            disabled={loading}
            variant="destructive"
            size="sm"
          >
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUsersCount()}</div>
            <p className="text-xs text-muted-foreground">
              Users in {userOrganization}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastSync ? formatDistanceToNow(lastSync, { addSuffix: true }) : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {needsSync() && <span className="text-orange-500">Needs sync</span>}
              {!needsSync() && lastSync && <span className="text-green-500">Up to date</span>}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className={`h-2 w-2 rounded-full ${
              loading ? 'bg-yellow-500 animate-pulse' : 
              error ? 'bg-red-500' : 
              'bg-green-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {loading ? 'Syncing...' : error ? 'Error' : 'Ready'}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Fetching users from Grafana' : 
               error ? 'Check connection' : 
               'Data cached locally'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>
            Grafana users that match organization: {userOrganization}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && organizationUsers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading users...</span>
            </div>
          ) : organizationUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found for organization &quot;{userOrganization}&quot;</p>
              <p className="text-sm mt-2">
                Users are filtered by login, name, or email containing the organization name.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizationUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || user.login?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">
                        {user.name || user.login}
                      </p>
                      {user.isGrafanaAdmin && (
                        <Badge variant="destructive">Bhashini</Badge>
                      )}
                      {user.role && (
                        <Badge variant="secondary">{user.role}</Badge>
                      )}
                      {user.isDisabled && (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Login: {user.login} • Org ID: {user.orgId}
                    </p>
                    <div className="mt-2">
                      <UserTeamsList userId={user.id} />
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <p className="text-xs text-muted-foreground">
                      ID: {user.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.isExternal ? 'External' : 'Internal'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
