import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/folders/[uid]/permissions - Get folder permissions
export async function GET(
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
    
    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    console.log(`🔍 Fetching permissions for folder ${uid}${orgId ? ` in organization ${orgId}` : ''}`);
    
    // Create Grafana client with proper auth and optional organization context
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // Switch to the organization context if provided
    if (orgId) {
      await grafanaClient.post(`/api/user/using/${orgId}`);
    }

    const response = await grafanaClient.get(`/api/folders/${uid}/permissions`);
    console.log(`✅ Successfully fetched permissions for folder ${uid}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching folder permissions:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch folder permissions';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions for this folder.';
      } else if (error.response?.status === 401) {
        hint = 'Please check your Grafana authentication credentials.';
      } else if (error.response?.status === 404) {
        hint = 'Folder not found or you do not have access to it.';
      }

      return NextResponse.json(
        { error: errorMessage, hint },
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
    
    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    console.log(`🔄 Updating permissions for folder ${uid}${orgId ? ` in organization ${orgId}` : ''}`);
    
    // Create Grafana client with proper auth and optional organization context
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // Switch to the organization context if provided
    if (orgId) {
      await grafanaClient.post(`/api/user/using/${orgId}`);
    }
    
    const response = await grafanaClient.post(`/api/folders/${uid}/permissions`, body);
    console.log(`✅ Successfully updated permissions for folder ${uid}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating folder permissions:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to update folder permissions';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions to manage folder permissions.';
      } else if (error.response?.status === 401) {
        hint = 'Please check your Grafana authentication credentials.';
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          hint
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
