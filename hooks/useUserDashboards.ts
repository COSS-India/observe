import { useState, useCallback } from 'react';
import { grafanaAPI } from '@/lib/api/grafana';
import type { Dashboard, DashboardFolder, GrafanaUser } from '@/types/grafana';
import { toast } from 'sonner';

export function useUserDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [folders, setFolders] = useState<DashboardFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<number | null>(null);

  const fetchUserAccessibleDashboards = useCallback(async (userEmail: string, userOrganization: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching dashboards for user: ${userEmail} in organization: ${userOrganization}`);
      
      // Step 1: Find the user and organization
      console.log(`🏢 Looking for user in organization: ${userOrganization}`);
      
      // First, get all organizations to find the right org
      const allOrgs = await grafanaAPI.listOrganizations();
      console.log('🏢 All organizations:', allOrgs);
      
      const userOrg = allOrgs.find(org => org.name === userOrganization);
      if (!userOrg) {
        throw new Error(`Organization ${userOrganization} not found in Grafana. Available orgs: ${allOrgs.map(o => o.name).join(', ')}`);
      }
      
      console.log(`✅ Found organization: ${userOrganization} (ID: ${userOrg.id})`);
      
      // Use Grafana's lookup API to get the user by email/login
      console.log(`🔍 Looking up user by email: ${userEmail}`);
      let grafanaUser;
      try {
        grafanaUser = await grafanaAPI.lookupUser(userEmail, userOrg.id);
        console.log(`✅ Found Grafana user via lookup API:`, {
          id: grafanaUser.id,
          email: grafanaUser.email,
          login: grafanaUser.login,
          name: grafanaUser.name,
          orgId: grafanaUser.orgId
        });
      } catch (lookupError: any) {
        console.error('❌ User lookup failed:', lookupError?.response?.data || lookupError?.message);
        throw new Error(`User ${userEmail} not found in Grafana organization ${userOrganization}. Error: ${lookupError?.response?.data?.message || lookupError?.message}`);
      }
      
      // Verify the user belongs to the correct organization
      if (grafanaUser.orgId !== userOrg.id) {
        console.warn(`⚠️ User found but belongs to different org. User orgId: ${grafanaUser.orgId}, Expected: ${userOrg.id}`);
        // This is still OK - the user exists, we'll work with their data
      }
      
      // Step 2: Get user's teams
      let userTeams: any[] = [];
      try {
        userTeams = await grafanaAPI.getUserTeams(grafanaUser.id, userOrg.id);
        console.log(`👥 User teams:`, userTeams);
      } catch (teamError) {
        console.warn(`⚠️ Could not fetch user teams:`, teamError);
        userTeams = [];
      }
      
      // Step 3: Get user's direct accessible folders and dashboards
      const accessibleFolders: DashboardFolder[] = [];
      const accessibleDashboards: Dashboard[] = [];
      
      try {
        // Get user's direct folder access (this respects user permissions)
        const userFolders = await grafanaAPI.getUserFolders(grafanaUser.id, userOrg.id);
        console.log(`👤 User accessible folders (raw API response):`, JSON.stringify(userFolders, null, 2));
        console.log(`👤 User accessible folders count:`, userFolders.length);
        
        // Get user's direct dashboard access
        const userDashboards = await grafanaAPI.getUserDashboards(grafanaUser.id, userOrg.id);
        console.log(`👤 User accessible dashboards:`, userDashboards);
        
        accessibleFolders.push(...userFolders);
        accessibleDashboards.push(...userDashboards);
        
        // Also get dashboards from each accessible folder
        for (const folder of userFolders) {
          try {
            const folderDashboards = await grafanaAPI.getDashboardsByFolder(folder.uid);
            console.log(`📊 Dashboards in folder ${folder.title}:`, folderDashboards);
            accessibleDashboards.push(...folderDashboards);
          } catch (folderError) {
            console.warn(`⚠️ Could not fetch dashboards from folder ${folder.title}:`, folderError);
          }
        }
        
      } catch (userError) {
        console.warn(`⚠️ Could not fetch user direct access:`, userError);
        
        // Fallback: try team-based access if user direct access fails
        console.log('🔄 Falling back to team-based access...');
        for (const team of userTeams) {
          try {
            // Get team folders
            const teamFolders = await grafanaAPI.getTeamFolders(team.id);
            console.log(`📁 Team ${team.name} folders:`, teamFolders);
            
            // Get team dashboards
            const teamDashboards = await grafanaAPI.getTeamDashboards(team.id);
            console.log(`📊 Team ${team.name} dashboards:`, teamDashboards);
            
            accessibleFolders.push(...teamFolders);
            accessibleDashboards.push(...teamDashboards);
          } catch (teamError) {
            console.warn(`⚠️ Could not fetch data for team ${team.name}:`, teamError);
          }
        }
      }
      
      // Step 5: Remove duplicates and filter by actual permissions
      const uniqueFolders = accessibleFolders.filter((folder, index, self) => 
        index === self.findIndex(f => f.uid === folder.uid)
      );
      
      const uniqueDashboards = accessibleDashboards.filter((dashboard, index, self) => 
        index === self.findIndex(d => d.uid === dashboard.uid)
      );
      
      // Additional permission check: verify user actually has access to these folders
      const verifiedFolders: DashboardFolder[] = [];
      const verifiedDashboards: Dashboard[] = [];
      
      for (const folder of uniqueFolders) {
        try {
          // Check if user has permission to this folder (pass orgId for correct context)
          const permissions = await grafanaAPI.getFolderPermissions(folder.uid, userOrg.id);
          console.log(`🔐 Permissions for folder ${folder.title} (${folder.uid}):`, JSON.stringify(permissions, null, 2));
          console.log(`👤 User ID: ${grafanaUser.id}, User teams:`, userTeams.map(t => ({ id: t.id, name: t.name })));
          
          // Check if user has any permission (view, edit, admin)
          const hasUserAccess = permissions.some(perm => 
            perm.userId === grafanaUser.id || 
            (perm.teamId && userTeams.some((team: any) => team.id === perm.teamId))
          );
          
          if (hasUserAccess) {
            verifiedFolders.push(folder);
            console.log(`✅ User has access to folder: ${folder.title}`);
          } else {
            console.log(`❌ User does not have access to folder: ${folder.title}`);
          }
        } catch (permError: any) {
          console.error(`❌ Could not check permissions for folder ${folder.title} (UID: ${folder.uid}):`, permError?.response?.data || permError?.message);
          console.error(`   Folder may not exist in organization ${userOrg.name} (ID: ${userOrg.id})`);
          // If we can't check permissions due to 404, skip this folder (don't include it)
          if (permError?.response?.status !== 404) {
            // For other errors (network, etc.), include the folder as fallback
            verifiedFolders.push(folder);
          }
        }
      }
      
      // Filter dashboards to only include those from verified folders
      for (const dashboard of uniqueDashboards) {
        const isInVerifiedFolder = verifiedFolders.some(folder => 
          dashboard.folderUid === folder.uid || dashboard.folderId === folder.id
        );
        
        if (isInVerifiedFolder || !dashboard.folderUid) { // Include dashboards without folders
          verifiedDashboards.push(dashboard);
        }
      }
      
      console.log(`📊 Final verified dashboards:`, verifiedDashboards.length);
      console.log(`📁 Final verified folders:`, verifiedFolders.length);
      
      // If no verified access, try to get all dashboards as fallback
      if (verifiedDashboards.length === 0 && verifiedFolders.length === 0) {
        console.log('🔄 No verified access found, trying to get all dashboards as fallback...');
        try {
          const allDashboards = await grafanaAPI.listDashboards();
          const allFolders = await grafanaAPI.listFolders();
          console.log(`📊 Fallback - All dashboards:`, allDashboards.length);
          console.log(`📁 Fallback - All folders:`, allFolders.length);
          setDashboards(allDashboards);
          setFolders(allFolders);
        } catch (fallbackError) {
          console.warn('⚠️ Fallback also failed:', fallbackError);
          setDashboards(verifiedDashboards);
          setFolders(verifiedFolders);
        }
      } else {
        setDashboards(verifiedDashboards);
        setFolders(verifiedFolders);
      }
      
      // Store the organization ID for dashboard/panel fetching
      setOrgId(userOrg.id);
      console.log(`✅ Set organization ID: ${userOrg.id} for dashboard/panel context`);
      
    } catch (err: unknown) {
      const error = err as any;
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch user dashboards';
      setError(errorMessage);
      
      console.error('Error fetching user dashboards:', err);
      
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dashboards,
    folders,
    loading,
    error,
    orgId,
    fetchUserAccessibleDashboards,
  };
}
