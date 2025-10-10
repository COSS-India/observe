import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3000';
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || '';

// DELETE /api/grafana/orgs/[id]/users/[userId] - Remove user from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: orgId, userId } = await params;

    const response = await axios.delete(
      `${GRAFANA_URL}/api/orgs/${orgId}/users/${userId}`,
      {
      headers: getGrafanaAuthHeaders(),
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('Error removing user from organization:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to remove user from organization', 
        details: err.response?.data?.message || err.message 
      },
      { status: err.response?.status || 500 }
    );
  }
}

// PATCH /api/grafana/orgs/[id]/users/[userId] - Update user role in organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: orgId, userId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'role is required' },
        { status: 400 }
      );
    }

    const response = await axios.patch(
      `${GRAFANA_URL}/api/orgs/${orgId}/users/${userId}`,
      { role },
      {
      headers: getGrafanaAuthHeaders(),
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('Error updating user role:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to update user role', 
        details: err.response?.data?.message || err.message 
      },
      { status: err.response?.status || 500 }
    );
  }
}
