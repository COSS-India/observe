import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/users/[id] - Get user by ID
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
    
    // Get user from org users endpoint (organization-scoped)
    const response = await grafanaClient.get('/api/org/users');
    const users = response.data;
    const user = users.find((u: { userId: number }) => u.userId === parseInt(id));
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in the current organization' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch user';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions for user access.';
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

// PUT /api/grafana/users/[id] - Update user
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
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });
    
    // Update user using organization-scoped endpoint
    // Note: For updating org user role, use PATCH /api/org/users/{orgUserId}
    // This updates the user's role within the organization
    const response = await grafanaClient.patch(`/api/org/users/${id}`, body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating user:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update user';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions for user updates.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
      } else if (error.response?.status === 404) {
        hint = 'User not found in the current organization.';
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

// DELETE /api/grafana/users/[id] - Delete user from organization
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
    
    // Remove user from organization using organization-scoped endpoint
    // This removes the user from the current organization
    const response = await grafanaClient.delete(`/api/org/users/${id}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error deleting user:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete user';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions for user deletion.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
      } else if (error.response?.status === 404) {
        hint = 'User not found in the current organization.';
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
