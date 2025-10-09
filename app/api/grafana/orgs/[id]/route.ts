import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;
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

// GET /api/grafana/orgs/[id] - Get organization by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Note: This requires Server Admin permissions
    // With Org Admin, only /api/org (current org) works
    const response = await grafanaClient.get(`/api/orgs/${id}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching organization:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch organization';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Accessing organization details requires Server Admin permissions.'
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

// PUT /api/grafana/orgs/[id] - Update organization
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if this is the current org and use appropriate endpoint
    // For current org: PUT /api/org
    // For other orgs: PUT /api/orgs/{id} (requires Server Admin)
    const currentOrgResponse = await grafanaClient.get('/api/org');
    const currentOrgId = currentOrgResponse.data.id;
    
    if (parseInt(id) === currentOrgId) {
      // Update current organization (works with Org Admin)
      const response = await grafanaClient.put('/api/org', body);
      return NextResponse.json(response.data);
    } else {
      // Update other organization (requires Server Admin)
      const response = await grafanaClient.put(`/api/orgs/${id}`, body);
      return NextResponse.json(response.data);
    }
  } catch (error) {
    console.error('Error updating organization:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to update organization';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Updating organizations requires Server Admin permissions. You can only update your current organization with Org Admin permissions.'
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

// DELETE /api/grafana/orgs/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Note: Deleting organizations requires Server Admin permissions
    const response = await grafanaClient.delete(`/api/orgs/${id}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error deleting organization:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to delete organization';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Deleting organizations requires Server Admin permissions.'
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
