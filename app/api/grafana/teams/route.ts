import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_ADMIN_USER = process.env.GRAFANA_ADMIN_USER || 'admin';
const GRAFANA_ADMIN_PASSWORD = process.env.GRAFANA_ADMIN_PASSWORD || 'password';

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

// GET /api/grafana/teams - List all teams
export async function GET() {
  try {
    // Teams API is organization-scoped by default
    // This works with Organization Admin permissions
    const response = await grafanaClient.get('/api/teams/search');
    
    // The response might have a 'teams' property or be an array directly
    const teamsData = response.data.teams || response.data;
    console.log('Teams API response:', teamsData);
    
    return NextResponse.json({ teams: Array.isArray(teamsData) ? teamsData : [] });
  } catch (error) {
    console.error('Error fetching teams:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch teams';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to list teams.'
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

// POST /api/grafana/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Teams API is organization-scoped by default
    // This works with Organization Admin permissions
    const response = await grafanaClient.post('/api/teams', body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating team:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to create team';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to create teams.'
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
