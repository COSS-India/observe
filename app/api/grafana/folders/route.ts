import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

interface Folder {
  uid: string;
  title: string;
  [key: string]: unknown;
}

// GET /api/grafana/folders - List all folders
export async function GET(request: NextRequest) {
  try {
    // Validate configuration
    const validation = validateGrafanaConfig();
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Grafana configuration is invalid',
        errors: validation.errors
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // Folders API is organization-scoped by default
    const response = await grafanaClient.get('/api/folders');
    
    // Filter out the "General" folder (uid is empty string or "general")
    const folders = Array.isArray(response.data) 
      ? response.data.filter((folder: Folder) => 
          folder.uid !== '' && 
          folder.uid !== 'general' && 
          folder.title?.toLowerCase() !== 'general'
        )
      : [];
    
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch folders';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to list folders.'
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

// POST /api/grafana/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    const validation = validateGrafanaConfig();
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Grafana configuration is invalid',
        errors: validation.errors
      }, { status: 500 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Folder title is required' },
        { status: 400 }
      );
    }

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });
    
    const response = await grafanaClient.post('/api/folders', body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating folder:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create folder';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions for folder creation.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
      } else if (error.response?.status === 409) {
        hint = 'Folder with this name already exists. Try a different name.';
      }

      return NextResponse.json({
        error: errorMessage,
        details: error.response?.data,
        hint
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
