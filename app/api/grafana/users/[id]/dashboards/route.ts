import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

interface Permission {
  userId?: number;
  userLogin?: string;
  teamId?: number;
  team?: string;
  role?: string;
  permission: number;
}

interface Folder {
  id: number;
  uid: string;
  title: string;
}

interface Dashboard {
  id: number;
  uid: string;
  title: string;
  uri: string;
  url: string;
  slug: string;
  type: string;
  tags: string[];
  isStarred: boolean;
  folderId: number;
  folderUid: string;
  folderTitle: string;
  folderUrl: string;
}

// GET /api/grafana/users/[id]/dashboards - Get dashboards accessible by a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching dashboards for user ID: ${userId}`);

    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    // Get auth headers (supports both Basic Auth and API Key)
    const headers = getGrafanaAuthHeaders(orgId ? parseInt(orgId) : undefined);

    // Step 1: Get all folders
    console.log('📁 Fetching all folders...');
    const foldersResponse = await axios.get<Folder[]>(
      `${GRAFANA_URL}/api/folders`,
      { headers }
    );
    const folders = foldersResponse.data;
    console.log(`✅ Found ${folders.length} folders`);

    // Step 2: Get user's teams
    console.log(`👥 Fetching teams for user ${userId}...`);
    const userTeamsResponse = await axios.get(
      `${GRAFANA_URL}/api/users/${userId}/teams`,
      { headers }
    );
    const userTeams = userTeamsResponse.data;
    const userTeamIds = userTeams.map((team: { id: number }) => team.id);
    console.log(`✅ User is member of ${userTeams.length} teams:`, userTeams.map((t: any) => ({ id: t.id, name: t.name })));

    // Step 3: Check each folder's permissions
    const accessibleFolderUids: string[] = [];
    console.log('🔐 Checking folder permissions...');

    for (const folder of folders) {
      try {
        const permissionsResponse = await axios.get<Permission[]>(
          `${GRAFANA_URL}/api/folders/${folder.uid}/permissions`,
          { headers }
        );
        const permissions = permissionsResponse.data;

        // Check if user has direct access or team access
        const hasAccess = permissions.some((perm) => {
          // Direct user permission
          if (perm.userId === userId) {
            console.log(`✅ User ${userId} has direct access to folder ${folder.title}`);
            return true;
          }
          // Team permission
          if (perm.teamId && userTeamIds.includes(perm.teamId)) {
            console.log(`✅ User ${userId} has team access to folder ${folder.title} via team ${perm.teamId}`);
            return true;
          }
          return false;
        });

        if (hasAccess) {
          accessibleFolderUids.push(folder.uid);
        }
      } catch (error) {
        // If we can't get permissions for a folder, skip it
        console.warn(`⚠️ Could not check permissions for folder ${folder.uid}:`, error);
        if (axios.isAxiosError(error)) {
          console.warn(`  Status: ${error.response?.status}, Message: ${error.response?.data?.message}`);
        }
      }
    }

    console.log(`📊 User has access to ${accessibleFolderUids.length} folders`);

    // Step 4: Fetch dashboards from accessible folders
    const allDashboards: Dashboard[] = [];

    if (accessibleFolderUids.length > 0) {
      console.log('📊 Fetching dashboards from accessible folders...');
      // Fetch dashboards for each accessible folder
      for (const folderUid of accessibleFolderUids) {
        try {
          const dashboardsResponse = await axios.get<Dashboard[]>(
            `${GRAFANA_URL}/api/search?type=dash-db&folderUids=${folderUid}`,
            { headers }
          );
          console.log(`  Found ${dashboardsResponse.data.length} dashboards in folder ${folderUid}`);
          allDashboards.push(...dashboardsResponse.data);
        } catch (error) {
          console.warn(`⚠️ Could not fetch dashboards for folder ${folderUid}:`, error);
        }
      }
    } else {
      console.warn('⚠️ No accessible folders found for user. Checking General folder...');
    }

    // Also check for dashboards in the General folder (no folder)
    try {
      const generalDashboardsResponse = await axios.get<Dashboard[]>(
        `${GRAFANA_URL}/api/search?type=dash-db&folderIds=0`,
        { headers }
      );
      console.log(`📊 Found ${generalDashboardsResponse.data.length} dashboards in General folder`);
      allDashboards.push(...generalDashboardsResponse.data);
    } catch (error) {
      console.warn('⚠️ Could not fetch dashboards from General folder:', error);
    }

    console.log(`✅ Total dashboards accessible by user: ${allDashboards.length}`);
    return NextResponse.json(allDashboards);
  } catch (error) {
    console.error('❌ Error fetching user dashboards:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to fetch user dashboards';
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.response?.data,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to fetch user dashboards. Ensure the API key has Admin or Viewer permissions.'
            : error.response?.status === 404
            ? 'User not found in this organization.'
            : undefined
        },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
