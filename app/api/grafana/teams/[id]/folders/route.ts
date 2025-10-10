import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    console.log(`🔍 Fetching folders for Team ID: ${teamId}`);

    // Get all folders
    const foldersResponse = await axios.get(
      `${GRAFANA_URL}/api/folders`,
      {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const allFolders = foldersResponse.data;
    const accessibleFolders = [];
    const seenUids = new Set(); // Track unique folder UIDs

    // Check permissions for each folder
    for (const folder of allFolders) {
      // Skip duplicates
      if (seenUids.has(folder.uid)) {
        continue;
      }

      try {
        const permissionsResponse = await axios.get(
          `${GRAFANA_URL}/api/folders/${folder.uid}/permissions`,
          {
            headers: {
              'Authorization': `Bearer ${GRAFANA_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const permissions = permissionsResponse.data;
        
        // Check if team has access
        const hasTeamAccess = permissions.some(
          (perm: { teamId?: number }) => perm.teamId === parseInt(teamId)
        );

        if (hasTeamAccess) {
          seenUids.add(folder.uid);
          accessibleFolders.push(folder);
        }
      } catch (error) {
        console.error(`Error checking permissions for folder ${folder.uid}:`, error);
      }
    }

    console.log(`✅ Team ${teamId} has access to ${accessibleFolders.length} unique folders`);

    return NextResponse.json(accessibleFolders);
  } catch (error) {
    console.error('Error fetching team folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team folders' },
      { status: 500 }
    );
  }
}
