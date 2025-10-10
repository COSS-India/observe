import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(),
});

// POST /api/grafana/dashboards/[uid]/move - Move dashboard to a folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const body = await request.json();
    const { folderUid } = body;

    // First, get the current dashboard
    const dashboardResponse = await grafanaClient.get(`/api/dashboards/uid/${uid}`);
    const dashboardData = dashboardResponse.data;

    // Update the dashboard with new folder
    // Important: Keep the original version to avoid "dashboard has been changed" error
    const updatePayload = {
      dashboard: {
        ...dashboardData.dashboard,
        // Keep id as is when updating (Grafana handles this internally)
        version: dashboardData.meta?.version || dashboardData.dashboard.version,
      },
      folderUid: folderUid || '', // Empty string for General folder
      overwrite: true,
      message: `Moved to folder ${folderUid || 'General'}`,
    };

    const response = await grafanaClient.post('/api/dashboards/db', updatePayload);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error moving dashboard:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to move dashboard';
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.response?.data,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to move dashboards.'
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
