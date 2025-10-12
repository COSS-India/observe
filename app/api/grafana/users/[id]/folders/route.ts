import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

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
    // Validate configuration
    const validation = validateGrafanaConfig();
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Grafana configuration is invalid',
        errors: validation.errors
      }, { status: 500 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Create Grafana client with proper auth and organization context
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    console.log(`🔍 Fetching folders for user ${userId}${orgId ? ` in org ${orgId}` : ''}`);

    // Switch to the organization context if provided
    if (orgId) {
      await grafanaClient.post(`/api/user/using/${orgId}`);
    }

    // Step 1: Get all folders (excluding General folder)
    const foldersResponse = await grafanaClient.get<Folder[]>('/api/folders');
    const allFolders = foldersResponse.data;
    
    // Filter out the "General" folder (uid is empty string or "general")
    const folders = allFolders.filter((folder: Folder) => 
      folder.uid !== '' && 
      folder.uid !== 'general' && 
      folder.title?.toLowerCase() !== 'general'
    );

    // Step 2: Get user's teams
    const userTeamsResponse = await grafanaClient.get(`/api/users/${userId}/teams`);
    const userTeams = userTeamsResponse.data;
    const userTeamIds = userTeams.map((team: { id: number }) => team.id);

    console.log(`🔍 Debug info - User team IDs:`, userTeamIds);

    // Step 3: Check each folder's permissions
    const accessibleFolders: Folder[] = [];

    for (const folder of folders) {
      try {
        const permissionsResponse = await grafanaClient.get<Permission[]>(
          `/api/folders/${folder.uid}/permissions`
        );
        const permissions = permissionsResponse.data;

        // Check if user has direct access or team access
        const hasAccess = permissions.some((perm: Permission) => {
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

    console.log(`✅ Found ${accessibleFolders.length} accessible folders for user ${userId}`);
    return NextResponse.json(accessibleFolders);
  } catch (error) {
    console.error('Error fetching user folders:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user folders';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions to fetch user folders.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          hint
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
