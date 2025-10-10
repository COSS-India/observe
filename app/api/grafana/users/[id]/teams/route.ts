import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

interface Team {
  id: number;
  orgId: number;
  name: string;
  email: string;
  avatarUrl: string;
  memberCount: number;
}

// GET /api/grafana/users/[id]/teams - Get teams for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Fetching teams for user ID: ${userId}`);
    
    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    // Get auth headers (supports both Basic Auth and API Key)
    const headers = getGrafanaAuthHeaders(orgId ? parseInt(orgId) : undefined);
    
    // Use the correct Grafana API endpoint: GET /api/users/:id/teams
    console.log(`📞 Calling GET ${GRAFANA_URL}/api/users/${userId}/teams`);
    const response = await axios.get<Team[]>(
      `${GRAFANA_URL}/api/users/${userId}/teams`,
      { headers }
    );
    
    console.log(`✅ User ${userId} belongs to ${response.data.length} teams`);
    if (response.data.length > 0) {
      console.log(`👥 Teams:`, response.data.map(t => ({ id: t.id, name: t.name })));
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('❌ Error fetching user teams:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to fetch user teams';
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.response?.data,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to fetch user teams. Ensure the API key has Admin or Viewer permissions.'
            : error.response?.status === 404
            ? 'User not found or user has no teams in this organization.'
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
