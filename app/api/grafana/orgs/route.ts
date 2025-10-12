import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/orgs - List all organizations
export async function GET() {
  try {
    // Validate configuration
    const validation = validateGrafanaConfig();
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Grafana configuration is invalid',
        errors: validation.errors
      }, { status: 500 });
    }

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(),
      timeout: 10000,
    });

    try {
      // Try to get all organizations (requires Server Admin)
      const response = await grafanaClient.get('/api/orgs');
      return NextResponse.json(response.data);
    } catch (serverAdminError) {
      // If Server Admin fails, try to get current organization only
      if (axios.isAxiosError(serverAdminError) && serverAdminError.response?.status === 403) {
        try {
          const orgResponse = await grafanaClient.get('/api/org');
          // Wrap single org in an array for consistent response format
          return NextResponse.json([orgResponse.data]);
        } catch (orgError) {
          throw serverAdminError; // Re-throw the original error
        }
      }
      throw serverAdminError;
    }
  } catch (error) {
    console.error('Error fetching organizations:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch organizations';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Listing all organizations requires Server Admin permissions. Use Basic Auth or ensure your API key has Server Admin role.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
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

// POST /api/grafana/orgs - Create a new organization
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
    
    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(),
      timeout: 10000,
    });
    
    // Note: Creating organizations requires Server Admin permissions
    const response = await grafanaClient.post('/api/orgs', body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating organization:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create organization';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Creating organizations requires Server Admin permissions. Use Basic Auth or ensure your API key has Server Admin role.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
      } else if (error.response?.status === 409) {
        hint = 'Organization with this name already exists. Try a different name.';
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
