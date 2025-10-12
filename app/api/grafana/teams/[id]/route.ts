import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/teams/[id] - Get team by ID
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // Teams API is organization-scoped by default
    const response = await grafanaClient.get(`/api/teams/${id}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching team:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch team';
      
      // Provide helpful hints based on error type
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions to access teams.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD.';
      } else if (error.response?.status === 404) {
        hint = 'Team not found or you do not have access to it.';
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

// PUT /api/grafana/teams/[id] - Update team
export async function PUT(
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

    const { id } = await params;
    const body = await request.json();
    const orgId = body.orgId;

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });
    
    // Teams API is organization-scoped by default
    const response = await grafanaClient.put(`/api/teams/${id}`, body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating team:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to update team';
      
      // Provide helpful hints based on error type
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions to update teams. Ensure Team Admin, Organization Admin, or Server Admin role.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD.';
      } else if (error.response?.status === 404) {
        hint = 'Team not found or you do not have access to it.';
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

// DELETE /api/grafana/teams/[id] - Delete team
export async function DELETE(
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });
    
    // Teams API is organization-scoped by default
    const response = await grafanaClient.delete(`/api/teams/${id}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error deleting team:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to delete team';
      
      // Provide helpful hints based on error type
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions to delete teams. Ensure Organization Admin or Server Admin role.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD.';
      } else if (error.response?.status === 404) {
        hint = 'Team not found or you do not have access to it.';
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
