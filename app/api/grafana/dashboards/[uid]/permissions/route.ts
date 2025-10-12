import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
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

    const { uid } = await params;
    const body = await request.json();
    const { teamId, permission, orgId } = body;

    if (!teamId || !permission) {
      return NextResponse.json(
        { error: 'Team ID and permission are required' },
        { status: 400 }
      );
    }

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // Get current dashboard to retrieve its ID
    const dashboardResponse = await grafanaClient.get(`/api/dashboards/uid/${uid}`);
    const dashboardId = dashboardResponse.data.dashboard.id;

    // Get current permissions
    const permissionsResponse = await grafanaClient.get(`/api/dashboards/id/${dashboardId}/permissions`);
    const currentPermissions = permissionsResponse.data;

    // Add or update team permission
    const newPermissions = currentPermissions.filter(
      (p: { teamId?: number }) => !(p.teamId === teamId)
    );

    newPermissions.push({
      teamId,
      permission,
    });

    // Update permissions
    await grafanaClient.post(`/api/dashboards/id/${dashboardId}/permissions`, {
      items: newPermissions,
    });

    return NextResponse.json({
      success: true,
      message: 'Dashboard permissions updated',
    });
  } catch (error) {
    const err = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
    console.error('Error updating dashboard permissions:', err.response?.data || err);
    
    // Provide helpful hints based on error type
    let hint = '';
    if (err.response?.status === 403) {
      hint = 'Your Grafana credentials lack the required permissions to modify dashboard permissions. Ensure Admin permissions.';
    } else if (err.response?.status === 401) {
      hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD.';
    } else if (err.response?.status === 404) {
      hint = 'Dashboard not found or you do not have access to it.';
    }

    return NextResponse.json({
      error: err.response?.data?.message || err.message || 'Failed to update dashboard permissions',
      details: err.response?.data,
      hint
    }, { status: err.response?.status || 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
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

    const { uid } = await params;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const orgId = searchParams.get('orgId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // Get current dashboard to retrieve its ID
    const dashboardResponse = await grafanaClient.get(`/api/dashboards/uid/${uid}`);
    const dashboardId = dashboardResponse.data.dashboard.id;

    // Get current permissions
    const permissionsResponse = await grafanaClient.get(`/api/dashboards/id/${dashboardId}/permissions`);
    const currentPermissions = permissionsResponse.data;

    // Remove team permission
    const newPermissions = currentPermissions.filter(
      (p: { teamId?: number }) => !(p.teamId === Number(teamId))
    );

    // Update permissions
    await grafanaClient.post(`/api/dashboards/id/${dashboardId}/permissions`, {
      items: newPermissions,
    });

    return NextResponse.json({
      success: true,
      message: 'Team permission removed',
    });
  } catch (error) {
    const err = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
    console.error('Error removing dashboard permission:', err.response?.data || err);
    
    // Provide helpful hints based on error type  
    let hint = '';
    if (err.response?.status === 403) {
      hint = 'Your Grafana credentials lack the required permissions to modify dashboard permissions. Ensure Admin permissions.';
    } else if (err.response?.status === 401) {
      hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD.';
    } else if (err.response?.status === 404) {
      hint = 'Dashboard not found or you do not have access to it.';
    }

    return NextResponse.json({
      error: err.response?.data?.message || err.message || 'Failed to remove dashboard permission',
      details: err.response?.data,
      hint
    }, { status: err.response?.status || 500 });
  }
}
