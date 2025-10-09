import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(),
});

// GET /api/grafana/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from org users endpoint (organization-scoped)
    const response = await grafanaClient.get('/api/org/users');
    const users = response.data;
    const user = users.find((u: { userId: number }) => u.userId === parseInt(id));
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to fetch user' },
        { status: error.response?.status || 500 }
      );
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
    const { id } = await params;
    const body = await request.json();
    
    // Update user using organization-scoped endpoint
    // Note: For updating org user role, use PATCH /api/org/users/{orgUserId}
    // This updates the user's role within the organization
    const response = await grafanaClient.patch(`/api/org/users/${id}`, body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating user:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to update user' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/grafana/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Remove user from organization using organization-scoped endpoint
    // This removes the user from the current organization
    const response = await grafanaClient.delete(`/api/org/users/${id}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error deleting user:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to delete user' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
