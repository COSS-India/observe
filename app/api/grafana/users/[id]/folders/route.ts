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

    console.log(`🔍 Fetching folders for user ID: ${userId}`);

    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    // Get auth headers (supports both Basic Auth and API Key)
    const headers = getGrafanaAuthHeaders(orgId ? parseInt(orgId) : undefined);

    // Step 1: Get all folders (excluding General folder)
    console.log('📁 Fetching all folders...');
    const foldersResponse = await axios.get<Folder[]>(
      `${GRAFANA_URL}/api/folders`,
      { headers }
    );
    const allFolders = foldersResponse.data;
    
    // Filter out the "General" folder (uid is empty string or "general")
    const folders = allFolders.filter((folder) => 
      folder.uid !== '' && 
      folder.uid !== 'general' && 
      folder.title?.toLowerCase() !== 'general'
    );
    console.log(`✅ Found ${folders.length} folders (excluding General)`);

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
    const accessibleFolders: Folder[] = [];
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
          accessibleFolders.push(folder);
        }
      } catch (error) {
        // If we can't get permissions for a folder, skip it
        console.warn(`⚠️ Could not check permissions for folder ${folder.uid}:`, error);
        if (axios.isAxiosError(error)) {
          console.warn(`  Status: ${error.response?.status}, Message: ${error.response?.data?.message}`);
        }
      }
    }

    console.log(`✅ User has access to ${accessibleFolders.length} folders`);
    return NextResponse.json(accessibleFolders);
  } catch (error) {
    console.error('❌ Error fetching user folders:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to fetch user folders';
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.response?.data,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to fetch user folders. Ensure the API key has Admin or Viewer permissions.'
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
