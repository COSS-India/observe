import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/dashboards/[uid] - Get dashboard by UID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    console.log(`📊 Fetching dashboard: ${uid}${orgId ? ` in org ${orgId}` : ''}`);
    
    const headers = getGrafanaAuthHeaders(orgId ? parseInt(orgId) : undefined);
    
    const response = await axios.get(
      `${GRAFANA_URL}/api/dashboards/uid/${uid}`,
      { headers }
    );
    
    console.log(`✅ Found dashboard: ${response.data?.dashboard?.title || uid}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`❌ Error fetching dashboard ${await params.then(p => p.uid)}:`, error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to fetch dashboard' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/grafana/dashboards/[uid] - Delete dashboard
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    console.log(`🗑️ Deleting dashboard: ${uid}${orgId ? ` in org ${orgId}` : ''}`);
    
    const headers = getGrafanaAuthHeaders(orgId ? parseInt(orgId) : undefined);
    
    const response = await axios.delete(
      `${GRAFANA_URL}/api/dashboards/uid/${uid}`,
      { headers }
    );
    
    console.log(`✅ Dashboard ${uid} deleted successfully`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to delete dashboard';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'You lack the required permissions to delete dashboards.'
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
