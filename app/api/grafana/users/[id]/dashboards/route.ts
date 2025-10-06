import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  headers: {
    'Authorization': `Bearer ${GRAFANA_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

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

    // Step 1: Get all folders
    const foldersResponse = await grafanaClient.get<Folder[]>('/api/folders');
    const folders = foldersResponse.data;

    // Step 2: Get user's teams
    const userTeamsResponse = await grafanaClient.get(`/api/users/${userId}/teams`);
    const userTeams = userTeamsResponse.data;
    const userTeamIds = userTeams.map((team: { id: number }) => team.id);

    // Step 3: Check each folder's permissions
    const accessibleFolderUids: string[] = [];

    for (const folder of folders) {
      try {
        const permissionsResponse = await grafanaClient.get<Permission[]>(
          `/api/folders/${folder.uid}/permissions`
        );
        const permissions = permissionsResponse.data;

        // Check if user has direct access or team access
        const hasAccess = permissions.some((perm) => {
          // Direct user permission
          if (perm.userId === userId) {
            return true;
          }
          // Team permission
          if (perm.teamId && userTeamIds.includes(perm.teamId)) {
            return true;
          }
          return false;
        });

        if (hasAccess) {
          accessibleFolderUids.push(folder.uid);
        }
      } catch (error) {
        // If we can't get permissions for a folder, skip it
        console.warn(`Could not check permissions for folder ${folder.uid}:`, error);
      }
    }

    // Step 4: Fetch dashboards from accessible folders
    const allDashboards: Dashboard[] = [];

    if (accessibleFolderUids.length > 0) {
      // Fetch dashboards for each accessible folder
      for (const folderUid of accessibleFolderUids) {
        try {
          const dashboardsResponse = await grafanaClient.get<Dashboard[]>(
            `/api/search?type=dash-db&folderUids=${folderUid}`
          );
          allDashboards.push(...dashboardsResponse.data);
        } catch (error) {
          console.warn(`Could not fetch dashboards for folder ${folderUid}:`, error);
        }
      }
    }

    // Also check for dashboards in the General folder (no folder)
    try {
      const generalDashboardsResponse = await grafanaClient.get<Dashboard[]>(
        '/api/search?type=dash-db&folderIds=0'
      );
      allDashboards.push(...generalDashboardsResponse.data);
    } catch (error) {
      console.warn('Could not fetch dashboards from General folder:', error);
    }

    return NextResponse.json(allDashboards);
  } catch (error) {
    console.error('Error fetching user dashboards:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user dashboards';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to fetch user dashboards.'
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
