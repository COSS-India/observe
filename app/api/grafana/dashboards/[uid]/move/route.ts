import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// POST /api/grafana/dashboards/[uid]/move - Move dashboard to a folder
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
    const { folderUid, orgId } = body;
    
    console.log(`🔄 Moving dashboard ${uid} to folder ${folderUid || 'General'}${orgId ? ` in organization ${orgId}` : ''}`);
    
    // Create Grafana client with proper auth and optional organization context
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId),
      timeout: 10000,
    });

    // Switch to the organization context if provided
    if (orgId) {
      await grafanaClient.post(`/api/user/using/${orgId}`);
    }

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
    console.log(`✅ Successfully moved dashboard ${uid} to folder ${folderUid || 'General'}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error moving dashboard:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to move dashboard';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions to move dashboards.';
      } else if (error.response?.status === 401) {
        hint = 'Please check your Grafana authentication credentials.';
      } else if (error.response?.status === 404) {
        hint = 'Dashboard or folder not found or you do not have access to it.';
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          hint,
          details: error.response?.data
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
