import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/users/[id]/teams - Get user's teams
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
    
    try {
      // Try direct Grafana API endpoint first (requires Server Admin)
      const response = await grafanaClient.get(`/api/users/${id}/teams`);
      return NextResponse.json(response.data);
    } catch (directError) {
      if (axios.isAxiosError(directError) && directError.response?.status === 403) {
        // Fallback: Get all teams and check membership manually
        const teamsResponse = await grafanaClient.get('/api/teams/search');
        const allTeams = teamsResponse.data.teams || [];
        
        // Check each team for the user's membership
        const userTeams = [];
        for (const team of allTeams) {
          try {
            const membersResponse = await grafanaClient.get(`/api/teams/${team.id}/members`);
            const members = membersResponse.data;
            
            // Check if user is a member of this team
            const isMember = members.some((member: { userId: number }) => member.userId === parseInt(id));
            if (isMember) {
              userTeams.push(team);
            }
          } catch (memberError) {
            // Continue checking other teams if one fails
            console.warn(`Failed to check team ${team.id} membership:`, memberError);
          }
        }
        
        return NextResponse.json(userTeams);
      }
      throw directError;
    }
  } catch (error) {
    console.error('Error fetching user teams:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch user teams';
      
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions for team access.';
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
