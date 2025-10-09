import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/folders/[uid]/permissions - Get folder permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    console.log(`🔐 Fetching permissions for folder: ${uid}${orgId ? ` in org ${orgId}` : ''}`);
    
    const headers = getGrafanaAuthHeaders(orgId ? parseInt(orgId) : undefined);
    
    const response = await axios.get(
      `${GRAFANA_URL}/api/folders/${uid}/permissions`,
      { headers }
    );
    
    console.log(`✅ Found ${response.data?.length || 0} permissions for folder ${uid}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`❌ Error fetching folder permissions for ${await params.then(p => p.uid)}:`, error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to fetch folder permissions' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/grafana/folders/[uid]/permissions - Update folder permissions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const body = await request.json();
    const headers = getGrafanaAuthHeaders();
    
    const response = await axios.post(
      `${GRAFANA_URL}/api/folders/${uid}/permissions`,
      body,
      { headers }
    );
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating folder permissions:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to update folder permissions';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'You lack the required permissions to manage folder permissions.'
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
