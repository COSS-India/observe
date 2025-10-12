import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/folders/[uid] - Get folder by UID
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
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    const response = await grafanaClient.get(`/api/folders/${uid}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching folder:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to fetch folder' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/grafana/folders/[uid] - Update folder
export async function PUT(
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
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });
    
    // First, fetch the current folder to get the latest version
    // This prevents 412 "Precondition Failed" errors due to version conflicts
    const currentFolder = await grafanaClient.get(`/api/folders/${uid}`);
    
    // Merge the update data with the current version
    const updatePayload = {
      ...body,
      version: currentFolder.data.version, // Always use the latest version from server
      overwrite: body.overwrite !== undefined ? body.overwrite : false,
    };
    
    const response = await grafanaClient.put(`/api/folders/${uid}`, updatePayload);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating folder:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to update folder';
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.response?.data,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to update folders.'
            : error.response?.status === 412
            ? 'Version conflict detected. The folder may have been modified by someone else.'
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

// DELETE /api/grafana/folders/[uid] - Delete folder
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
    const orgId = searchParams.get('orgId');

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });
    
    const response = await grafanaClient.delete(`/api/folders/${uid}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error deleting folder:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to delete folder';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to delete folders.'
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
