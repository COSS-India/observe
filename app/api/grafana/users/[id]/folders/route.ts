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
  url: string;
  hasAcl: boolean;
  canSave: boolean;
  canEdit: boolean;
  canAdmin: boolean;
}

// GET /api/grafana/users/[id]/folders - Get folders accessible by a specific user
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

    // Step 1: Get all folders (excluding General folder)
    const foldersResponse = await grafanaClient.get<Folder[]>('/api/folders');
    const allFolders = foldersResponse.data;
    
    // Filter out the "General" folder (uid is empty string or "general")
    const folders = allFolders.filter((folder) => 
      folder.uid !== '' && 
      folder.uid !== 'general' && 
      folder.title?.toLowerCase() !== 'general'
    );

    // Step 2: Get user's teams
    const userTeamsResponse = await grafanaClient.get(`/api/users/${userId}/teams`);
    const userTeams = userTeamsResponse.data;
    const userTeamIds = userTeams.map((team: { id: number }) => team.id);

    // Step 3: Check each folder's permissions
    const accessibleFolders: Folder[] = [];

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
          accessibleFolders.push(folder);
        }
      } catch (error) {
        // If we can't get permissions for a folder, skip it
        console.warn(`Could not check permissions for folder ${folder.uid}:`, error);
      }
    }

    return NextResponse.json(accessibleFolders);
  } catch (error) {
    console.error('Error fetching user folders:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user folders';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to fetch user folders.'
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
