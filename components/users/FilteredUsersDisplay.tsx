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
        className="h-8 px-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Show Teams
        <ChevronRight className="h-4 w-4 ml-2" />
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
          className="h-8 px-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Hide
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
        <span className="text-sm text-muted-foreground">No teams</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(false)}
        className="h-8 px-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Hide
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
      {teams.map((team) => (
        <Badge key={team.id} variant="outline" className="text-sm px-3 py-1">
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Organization Users</h2>
          <p className="text-sm text-muted-foreground">
            Grafana users filtered by organization: <strong>{userOrganization}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={syncUsers}
            disabled={loading}
            variant="outline"
            className="h-11 px-6 border-input hover:bg-accent rounded-lg"
          >
            Sync Users
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={forceRefresh}
            disabled={loading}
            className="h-11 px-6 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Force Refresh
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={clearUsers}
            disabled={loading}
            variant="destructive"
            className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
          >
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{getUsersCount()}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Users in {userOrganization}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Sync</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {lastSync ? formatDistanceToNow(lastSync, { addSuffix: true }) : 'Never'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {needsSync() && <span className="text-orange-500">Needs sync</span>}
              {!needsSync() && lastSync && <span className="text-green-500">Up to date</span>}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            <div className={`h-3 w-3 rounded-full ${
              loading ? 'bg-yellow-500 animate-pulse' : 
              error ? 'bg-red-500' : 
              'bg-green-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-foreground">
              {loading ? 'Syncing...' : error ? 'Error' : 'Ready'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
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
      <Card className="shadow-sm border border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Users List</CardTitle>
          <CardDescription className="text-muted-foreground">
            Grafana users that match organization: {userOrganization}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && organizationUsers.length === 0 ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-muted-foreground">Loading users...</span>
            </div>
          ) : organizationUsers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
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
                  className="flex items-center space-x-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {user.name?.charAt(0)?.toUpperCase() || user.login?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-foreground">
                        {user.name || user.login}
                      </p>
                      {user.isGrafanaAdmin && (
                        <Badge variant="destructive" className="px-2 py-1">Admin</Badge>
                      )}
                      {user.role && (
                        <Badge variant="secondary" className="px-2 py-1">{user.role}</Badge>
                      )}
                      {user.isDisabled && (
                        <Badge variant="outline" className="px-2 py-1">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Login: {user.login} • Org ID: {user.orgId}
                    </p>
                    <div className="mt-3">
                      <UserTeamsList userId={user.id} />
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <p className="text-sm text-muted-foreground">
                      ID: {user.id}
                    </p>
                    <p className="text-sm text-muted-foreground">
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
