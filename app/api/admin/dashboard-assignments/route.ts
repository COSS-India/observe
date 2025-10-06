import { NextRequest, NextResponse } from 'next/server';
import { configManager } from '@/lib/config/configManager';
import { grafanaAPI } from '@/lib/api/grafana';

/**
 * Admin API for assigning dashboards to organizations
 * Only accessible by super admins
 */

// Helper to check if user is super admin
async function checkSuperAdmin(request: NextRequest) {
  // Get user from session/token (simplified for now)
  // const authHeader = request.headers.get('authorization');
  const userEmail = request.headers.get('x-user-email'); // You'd get this from session
  
  if (!userEmail) {
    return { isAdmin: false, email: null };
  }

  const isAdmin = await configManager.isSuperAdmin(userEmail);
  return { isAdmin, email: userEmail };
}

/**
 * GET /api/admin/dashboard-assignments
 * Get all organization-dashboard mappings
 */
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await checkSuperAdmin(request);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const mappings = await configManager.getOrganizationMappings();
    
    return NextResponse.json({
      success: true,
      data: mappings,
    });
  } catch (error) {
    console.error('Error getting dashboard assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/dashboard-assignments
 * Assign dashboard to organization
 * 
 * Body: { orgId: string, dashboardUid: string, assignToGrafana?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, email } = await checkSuperAdmin(request);
    
    if (!isAdmin || !email) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orgId, dashboardUid, folderUid, assignToGrafana = true } = body;

    if (!orgId || (!dashboardUid && !folderUid)) {
      return NextResponse.json(
        { error: 'orgId and (dashboardUid or folderUid) are required' },
        { status: 400 }
      );
    }

    // Get organization mapping
    const orgMapping = await configManager.getOrganizationMapping(orgId);
    if (!orgMapping) {
      return NextResponse.json(
        { error: `Organization not found: ${orgId}` },
        { status: 404 }
      );
    }

    // Assign in Grafana if requested
    if (assignToGrafana && orgMapping.grafanaTeamIds.length > 0) {
      const teamId = orgMapping.grafanaTeamIds[0]; // Use first team
      
      if (dashboardUid) {
        // Note: You'll need to implement this in grafana.ts
        // For now, we just update the config
        console.log(`Would assign dashboard ${dashboardUid} to team ${teamId} in Grafana`);
      }
      
      if (folderUid) {
        // Assign folder permissions to team in Grafana
        try {
          await grafanaAPI.updateFolderPermissions(folderUid, {
            items: [{
              teamId: teamId,
              permission: 1, // View permission
            }],
          });
          console.log(`✅ Assigned folder ${folderUid} to team ${teamId} in Grafana`);
        } catch (error) {
          console.error(`Failed to assign folder in Grafana:`, error);
        }
      }
    }

    // Update config file
    if (dashboardUid) {
      await configManager.assignDashboardToOrg(orgId, dashboardUid, email);
    }
    
    if (folderUid) {
      await configManager.assignFolderToOrg(orgId, folderUid, email);
    }

    return NextResponse.json({
      success: true,
      message: 'Dashboard/folder assigned successfully',
      data: {
        orgId,
        dashboardUid,
        folderUid,
        assignedToGrafana: assignToGrafana,
      },
    });
  } catch (error) {
    console.error('Error assigning dashboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/dashboard-assignments
 * Remove dashboard from organization
 * 
 * Body: { orgId: string, dashboardUid: string, removeFromGrafana?: boolean }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin, email } = await checkSuperAdmin(request);
    
    if (!isAdmin || !email) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orgId, dashboardUid, folderUid, removeFromGrafana = true } = body;

    if (!orgId || (!dashboardUid && !folderUid)) {
      return NextResponse.json(
        { error: 'orgId and (dashboardUid or folderUid) are required' },
        { status: 400 }
      );
    }

    // Get organization mapping
    const orgMapping = await configManager.getOrganizationMapping(orgId);
    if (!orgMapping) {
      return NextResponse.json(
        { error: `Organization not found: ${orgId}` },
        { status: 404 }
      );
    }

    // Remove from Grafana if requested
    if (removeFromGrafana && orgMapping.grafanaTeamIds.length > 0) {
      const teamId = orgMapping.grafanaTeamIds[0];
      
      if (folderUid) {
        // Remove folder permissions from team in Grafana
        try {
          await grafanaAPI.updateFolderPermissions(folderUid, {
            items: [], // Remove all team permissions
          });
          console.log(`✅ Removed folder ${folderUid} from team ${teamId} in Grafana`);
        } catch (error) {
          console.error(`Failed to remove folder from Grafana:`, error);
        }
      }
    }

    // Update config file
    if (dashboardUid) {
      await configManager.removeDashboardFromOrg(orgId, dashboardUid, email);
    }
    
    if (folderUid) {
      await configManager.removeFolderFromOrg(orgId, folderUid, email);
    }

    return NextResponse.json({
      success: true,
      message: 'Dashboard/folder removed successfully',
      data: {
        orgId,
        dashboardUid,
        folderUid,
        removedFromGrafana: removeFromGrafana,
      },
    });
  } catch (error) {
    console.error('Error removing dashboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
