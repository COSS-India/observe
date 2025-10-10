import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;
const GRAFANA_ADMIN_USER = process.env.GRAFANA_ADMIN_USER || 'admin';
const GRAFANA_ADMIN_PASSWORD = process.env.GRAFANA_ADMIN_PASSWORD || 'password';

// Create client with basic auth for server admin operations
const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  auth: {
    username: GRAFANA_ADMIN_USER,
    password: GRAFANA_ADMIN_PASSWORD,
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

// GET /api/grafana/orgs - List all organizations
export async function GET() {
  try {
    // First try to get all organizations (requires Server Admin)
    try {
      const response = await grafanaClient.get('/api/orgs');
      return NextResponse.json(response.data);
    } catch (orgsError) {
      // If that fails, fall back to current organization
      console.log('Cannot access /api/orgs, falling back to current organization');
      const response = await grafanaClient.get('/api/org');
      
      // Wrap single org in an array for consistent response format
      return NextResponse.json([response.data]);
    }
  } catch (error) {
    console.error('Error fetching organizations:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch organizations';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Listing all organizations requires Server Admin permissions. With Organization Admin, only the current organization is accessible.'
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

// POST /api/grafana/orgs - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Note: Creating organizations requires Server Admin permissions
    // This will fail with Organization Admin permissions
    const response = await grafanaClient.post('/api/orgs', body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating organization:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to create organization';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Creating organizations requires Server Admin permissions or Grafana may be configured for single-organization mode. Contact your Grafana administrator to enable multi-organization support.'
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
