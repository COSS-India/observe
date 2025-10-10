import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    console.log(`🔍 Fetching dashboards for Team ID: ${teamId}`);

    // Get auth headers (supports Basic Auth)
    const headers = getGrafanaAuthHeaders();

    // Step 1: Get all folders that the team has access to
    const foldersResponse = await axios.get(
      `${GRAFANA_URL}/api/folders`,
      { headers }
    );

    const allFolders = foldersResponse.data;
    const accessibleFolders = [];

    // Step 2: Check permissions for each folder
    for (const folder of allFolders) {
      try {
        const permissionsResponse = await axios.get(
          `${GRAFANA_URL}/api/folders/${folder.uid}/permissions`,
          { headers }
        );

        const permissions = permissionsResponse.data;
        
        // Check if team has access to this folder
        const hasTeamAccess = permissions.some(
          (perm: { teamId?: number }) => perm.teamId === parseInt(teamId)
        );

        if (hasTeamAccess) {
          accessibleFolders.push(folder);
        }
      } catch (error) {
        console.error(`Error checking permissions for folder ${folder.uid}:`, error);
      }
    }

    console.log(`✅ Team ${teamId} has access to ${accessibleFolders.length} folders`);
    if (accessibleFolders.length > 0) {
      console.log(`📁 Accessible folder UIDs:`, accessibleFolders.map(f => ({ uid: f.uid, id: f.id, title: f.title })));
    }

    // Step 3: Get dashboards from accessible folders
    const dashboards = [];
    const seenUids = new Set(); // Track unique dashboard UIDs

    for (const folder of accessibleFolders) {
      try {
        console.log(`🔍 Fetching dashboards for folder: ${folder.title} (ID: ${folder.id}, UID: ${folder.uid})`);
        
        // Try multiple search methods to find dashboards
        const searchResponse = await axios.get(
          `${GRAFANA_URL}/api/search`,
          {
            params: {
              type: 'dash-db',
              folderIds: folder.id,
            },
            headers
          }
        );

        console.log(`📊 Found ${searchResponse.data.length} dashboards in folder ${folder.title}`);
        
        // Also try alternative search without folderIds to see all dashboards
        if (searchResponse.data.length === 0) {
          const altSearchResponse = await axios.get(
            `${GRAFANA_URL}/api/search`,
            {
              params: {
                type: 'dash-db',
                folderUids: folder.uid, // Try with folderUids instead
              },
              headers
            }
          );
          console.log(`🔄 Alternative search (folderUids) found ${altSearchResponse.data.length} dashboards`);
          
          if (altSearchResponse.data.length > 0) {
            searchResponse.data = altSearchResponse.data;
          }
        }

        console.log(`📊 Found ${searchResponse.data.length} dashboards in folder ${folder.title}`);

        // Filter out duplicates by UID
        const uniqueDashboards = searchResponse.data.filter((dash: { uid: string }) => {
          if (seenUids.has(dash.uid)) {
            return false;
          }
          seenUids.add(dash.uid);
          return true;
        });

        if (uniqueDashboards.length > 0) {
          console.log(`📊 Sample dashboard from folder ${folder.title}:`, uniqueDashboards[0]);
        }

        dashboards.push(...uniqueDashboards);
      } catch (error) {
        console.error(`Error fetching dashboards for folder ${folder.uid}:`, error);
      }
    }

    console.log(`✅ Found ${dashboards.length} unique dashboards for Team ${teamId}`);
    if (dashboards.length > 0) {
      console.log(`📊 Sample dashboard structure:`, dashboards[0]);
    }

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error('Error fetching team dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team dashboards' },
      { status: 500 }
    );
  }
}
