import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/teams/[id]/members - Get team members
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

    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    const response = await grafanaClient.get(`/api/teams/${teamId}/members`);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('Error fetching team members:', err.response?.data || err.message);
    
    // Provide helpful hints based on error type
    let hint = '';
    if (err.response?.status === 403) {
      hint = 'Your Grafana credentials lack the required permissions to view team members.';
    } else if (err.response?.status === 401) {
      hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD.';
    } else if (err.response?.status === 404) {
      hint = 'Team not found or you do not have access to it.';
    }

    return NextResponse.json({
      error: 'Failed to fetch team members',
      details: err.response?.data?.message || err.message,
      hint
    }, { status: err.response?.status || 500 });
  }
}

// POST /api/grafana/teams/[id]/members - Add user to team
export async function POST(
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

    const { id: teamId } = await params;
    const body = await request.json();
    const { userId, orgId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    const response = await grafanaClient.post(`/api/teams/${teamId}/members`, { userId });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('Error adding team member:', err.response?.data || err.message);
    
    // Provide helpful hints based on error type
    let hint = '';
    if (err.response?.status === 403) {
      hint = 'Your Grafana credentials lack the required permissions to add team members. Ensure Team Admin, Organization Admin, or Server Admin role.';
    } else if (err.response?.status === 401) {
      hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD.';
    } else if (err.response?.status === 404) {
      hint = 'Team or user not found, or you do not have access to them.';
    } else if (err.response?.status === 409) {
      hint = 'User is already a member of this team.';
    }

    return NextResponse.json({
      error: 'Failed to add team member',
      details: err.response?.data?.message || err.message,
      hint
    }, { status: err.response?.status || 500 });
  }
}
