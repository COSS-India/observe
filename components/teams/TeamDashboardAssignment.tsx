'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGrafanaTeams } from '@/hooks/useGrafanaTeams';
import { useGrafanaDashboards } from '@/hooks/useGrafanaDashboards';
import { useAuthStore } from '@/lib/store/authStore';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DashboardAssignment {
  dashboardUid: string;
  dashboardTitle: string;
  permission: 1 | 2 | 4; // 1=View, 2=Edit, 4=Admin
}

interface TeamDashboardConfig {
  teamId: number;
  teamName: string;
  assignments: DashboardAssignment[];
}

export function TeamDashboardAssignment() {
  const { teams, loading: teamsLoading, fetchTeams } = useGrafanaTeams();
  const { dashboards, loading: dashboardsLoading, fetchDashboards } = useGrafanaDashboards();
  const { user } = useAuthStore();
  
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [teamConfigs, setTeamConfigs] = useState<Map<number, DashboardAssignment[]>>(new Map());
  const [selectedDashboard, setSelectedDashboard] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<1 | 2 | 4>(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch teams and dashboards on mount
  useEffect(() => {
    fetchTeams();
    fetchDashboards();
  }, [fetchTeams, fetchDashboards]);

  // Load existing assignments
  useEffect(() => {
    async function loadAssignments() {
      try {
        const response = await fetch('/api/admin/dashboard-assignments', {
          headers: {
            'x-user-email': user?.email || '',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const configs = new Map<number, DashboardAssignment[]>();
          
          data.data.forEach((org: any) => {
            if (org.dashboardMappings) {
              const teamId = org.dashboardMappings.teamId;
              const assignments: DashboardAssignment[] = org.dashboardMappings.accessibleDashboardUids.map((uid: string) => {
                const dashboard = dashboards.find(d => d.uid === uid);
                return {
                  dashboardUid: uid,
                  dashboardTitle: dashboard?.title || uid,
                  permission: 1, // Default view permission
                };
              });
              configs.set(teamId, assignments);
            }
          });
          
          setTeamConfigs(configs);
        }
      } catch (error) {
        console.error('Failed to load assignments:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (!teamsLoading && !dashboardsLoading && user) {
      loadAssignments();
    }
  }, [teamsLoading, dashboardsLoading, user, dashboards]);

  const currentTeamAssignments = selectedTeam !== null ? teamConfigs.get(selectedTeam) || [] : [];
  const currentTeam = teams.find(t => t.id === selectedTeam);

  const handleAddAssignment = () => {
    if (!selectedTeam || !selectedDashboard) return;

    const dashboard = dashboards.find(d => d.uid === selectedDashboard);
    if (!dashboard) return;

    const newAssignment: DashboardAssignment = {
      dashboardUid: selectedDashboard,
      dashboardTitle: dashboard.title,
      permission: selectedPermission,
    };

    const existingAssignments = teamConfigs.get(selectedTeam) || [];
    
    // Check if already assigned
    if (existingAssignments.find(a => a.dashboardUid === selectedDashboard)) {
      setMessage({ type: 'error', text: 'Dashboard already assigned to this team' });
      return;
    }

    const updatedAssignments = [...existingAssignments, newAssignment];
    setTeamConfigs(new Map(teamConfigs.set(selectedTeam, updatedAssignments)));
    setSelectedDashboard('');
    setMessage({ type: 'success', text: 'Dashboard added (remember to save)' });
  };

  const handleRemoveAssignment = (dashboardUid: string) => {
    if (!selectedTeam) return;

    const existingAssignments = teamConfigs.get(selectedTeam) || [];
    const updatedAssignments = existingAssignments.filter(a => a.dashboardUid !== dashboardUid);
    setTeamConfigs(new Map(teamConfigs.set(selectedTeam, updatedAssignments)));
    setMessage({ type: 'success', text: 'Dashboard removed (remember to save)' });
  };

  const handleSave = async () => {
    if (!selectedTeam || !currentTeam) return;

    setSaving(true);
    setMessage(null);

    try {
      // Get organization for this team (assuming 1:1 mapping)
      const orgMapping = {
        'Team 1': 'org-karmayogi',
        'Team 2': 'org-ministry-education',
        'Team 3': 'org-ministry-health',
      };
      
      const orgId = orgMapping[currentTeam.name as keyof typeof orgMapping] || 'org-karmayogi';
      const assignments = teamConfigs.get(selectedTeam) || [];

      let successCount = 0;
      let errorCount = 0;

      // Save each dashboard assignment individually
      for (const assignment of assignments) {
        try {
          // Save to config file
          const response = await fetch('/api/admin/dashboard-assignments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': user?.email || '',
            },
            body: JSON.stringify({
              orgId,
              dashboardUid: assignment.dashboardUid, // Send singular, not plural
            }),
          });

          if (response.ok) {
            // Now update Grafana permissions via API (optional - skip if no permissions)
            try {
              const permResponse = await fetch(`/api/grafana/dashboards/${assignment.dashboardUid}/permissions`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  teamId: selectedTeam,
                  permission: assignment.permission,
                }),
              });
              
              if (permResponse.ok) {
                console.log(`✅ Set Grafana permissions for ${assignment.dashboardUid}`);
              } else {
                // Don't fail if Grafana permissions fail - config file update is more important
                const permError = await permResponse.json();
                console.warn(`⚠️  Could not set Grafana permissions: ${permError.error}`);
              }
              
              successCount++;
            } catch (error) {
              console.warn(`⚠️  Grafana permission update skipped for ${assignment.dashboardUid}:`, error);
              // Still count as success since config file was updated
              successCount++;
            }
          } else {
            const error = await response.json();
            console.error(`Failed to save assignment for ${assignment.dashboardUid}:`, error);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error saving assignment for ${assignment.dashboardUid}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        setMessage({ type: 'success', text: `All ${successCount} assignments saved successfully!` });
      } else if (successCount > 0) {
        setMessage({ type: 'error', text: `Saved ${successCount} assignments, but ${errorCount} failed` });
      } else {
        setMessage({ type: 'error', text: 'Failed to save assignments' });
      }
    } catch (error) {
      console.error('Failed to save assignments:', error);
      setMessage({ type: 'error', text: 'Failed to save assignments' });
    } finally {
      setSaving(false);
    }
  };

  const availableDashboards = dashboards.filter(
    d => !currentTeamAssignments.find(a => a.dashboardUid === d.uid)
  );

  if (loading || teamsLoading || dashboardsLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground">Loading team and dashboard data...</div>
            <div className="text-sm text-muted-foreground">
              Teams: {teamsLoading ? 'Loading...' : `${teams.length} loaded`} | 
              Dashboards: {dashboardsLoading ? 'Loading...' : `${dashboards.length} loaded`}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show warning if no data
  if (teams.length === 0 || dashboards.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {teams.length === 0 && 'No teams found. Please create teams in Grafana first.'}
              {dashboards.length === 0 && ' No dashboards found. Please create dashboards in Grafana first.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Dashboard Assignments</CardTitle>
          <CardDescription>
            Assign dashboards to teams to control user access based on their organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Team</label>
            <Select
              value={selectedTeam?.toString() || ''}
              onValueChange={(value) => {
                setSelectedTeam(Number(value));
                setMessage(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a team..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name} (ID: {team.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTeam && currentTeam && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h3 className="font-semibold mb-2">
                  Assigned Dashboards for {currentTeam.name}
                </h3>
                {currentTeamAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No dashboards assigned yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentTeamAssignments.map((assignment) => (
                      <div
                        key={assignment.dashboardUid}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{assignment.dashboardTitle}</div>
                          <div className="text-sm text-muted-foreground">
                            UID: {assignment.dashboardUid}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {assignment.permission === 1 ? 'View' : assignment.permission === 2 ? 'Edit' : 'Admin'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAssignment(assignment.dashboardUid)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold">Add Dashboard</h3>
                <div className="flex gap-2">
                  <Select
                    value={selectedDashboard}
                    onValueChange={setSelectedDashboard}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a dashboard..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDashboards.map((dashboard) => (
                        <SelectItem key={dashboard.uid} value={dashboard.uid}>
                          {dashboard.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedPermission.toString()}
                    onValueChange={(v) => setSelectedPermission(Number(v) as 1 | 2 | 4)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">View</SelectItem>
                      <SelectItem value="2">Edit</SelectItem>
                      <SelectItem value="4">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleAddAssignment}
                    disabled={!selectedDashboard}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. <strong>Select a Team</strong>: Choose the Grafana team (which represents an organization/role)</p>
          <p>2. <strong>Assign Dashboards</strong>: Add dashboards that should be accessible to this team</p>
          <p>3. <strong>Set Permissions</strong>: Choose View, Edit, or Admin permission level</p>
          <p>4. <strong>Save Changes</strong>: Saves to config file (Grafana permissions sync is optional)</p>
          <p className="text-muted-foreground pt-2">
            Users logging in will see only the dashboards assigned to their team (based on their organization from Bhashini API)
          </p>
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> To sync permissions with Grafana, your service account needs 
              <code className="mx-1 px-1 bg-muted">dashboards.permissions:write</code> permission.
              The assignments will still work without it (stored in config file).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
