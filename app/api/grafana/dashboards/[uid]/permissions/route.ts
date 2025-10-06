import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
const GRAFANA_SERVICE_ACCOUNT_TOKEN = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  headers: {
    'Authorization': `Bearer ${GRAFANA_SERVICE_ACCOUNT_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;
    const body = await request.json();
    const { teamId, permission } = body;

    if (!teamId || !permission) {
      return NextResponse.json(
        { error: 'Team ID and permission are required' },
        { status: 400 }
      );
    }

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
    return NextResponse.json(
      { error: err.response?.data?.message || err.message || 'Failed to update dashboard permissions' },
      { status: err.response?.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

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
    return NextResponse.json(
      { error: err.response?.data?.message || err.message || 'Failed to remove dashboard permission' },
      { status: err.response?.status || 500 }
    );
  }
}
