import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/orgs/[id]/folders - Get organization folders
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: orgId } = await params;
    
    // Create Grafana client with proper auth and organization context
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId),
      timeout: 10000,
    });

    console.log(`🔍 Fetching folders for organization: ${orgId}`);

    // Switch to the organization context
    await grafanaClient.post(`/api/user/using/${orgId}`);

    // Fetch all folders from this organization
    const response = await grafanaClient.get('/api/folders');
    
    // Filter out the "General" folder
    const folders = response.data.filter((folder: { uid: string; title?: string }) =>
      folder.uid !== '' &&
      folder.uid !== 'general' &&
      folder.title?.toLowerCase() !== 'general'
    );
    
    console.log(`📁 Found ${folders.length} folders in organization ${orgId}`);
    
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching organization folders:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch organization folders';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions for organization access.';
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
      { error: 'Failed to fetch organization folders' },
      { status: 500 }
    );
  }
}
