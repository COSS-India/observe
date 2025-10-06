import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  headers: {
    'Authorization': `Bearer ${GRAFANA_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// GET /api/grafana/orgs - List all organizations
export async function GET() {
  try {
    // Note: Listing all organizations requires Server Admin permissions
    // With Organization Admin, we can only get the current organization
    // For now, we'll return the current organization details
    const response = await grafanaClient.get('/api/org');
    
    // Wrap single org in an array for consistent response format
    return NextResponse.json([response.data]);
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
            ? 'Creating organizations requires Server Admin permissions. With Organization Admin, you can only manage the current organization.'
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
