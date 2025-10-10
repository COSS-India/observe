import { NextRequest, NextResponse } from 'next/server';
import grafanaClient from '@/lib/grafana-client';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function fetchTeamByOrganization(
  organizationName: string
): Promise<{ teamId?: number }> {
  try {
    console.log(`🔍 Looking for team matching organization: "${organizationName}"`);
    
    // Get all teams from Grafana
    const response = await grafanaClient.get('/api/teams/search', {
      params: { 
        perpage: 1000,
      },
    });

    const teams = response.data.teams || [];
    console.log(`📋 Found ${teams.length} total teams in Grafana`);
    
    // Find team with matching name (case-insensitive)
    const matchingTeam = teams.find((t: { name: string; id: number }) => 
      t.name.toLowerCase() === organizationName.toLowerCase()
    );

    if (matchingTeam) {
      console.log(`✅ Team found! Name: "${matchingTeam.name}", ID: ${matchingTeam.id}`);
      return { teamId: matchingTeam.id };
    }

    console.warn(`❌ No team found with name "${organizationName}"`);
    return { teamId: undefined };
  } catch (error) {
    console.error('❌ Error fetching team:', error);
    return { teamId: undefined };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, captcha_text, captcha_id } = await request.json();

    // Only use FastAPI backend authentication
    try {
      console.log('🔄 Attempting FastAPI backend authentication...');
      const backendResponse = await axios.post(`${BACKEND_URL}/v1/signin`, {
        email: username,
        password: password,
        captcha_text: captcha_text,
        captcha_id: captcha_id
      });

      const backendUser = backendResponse.data;
      console.log('✅ FastAPI authentication successful:', { email: backendUser.email, role: backendUser.role });

      // Map backend user to frontend format
      const user = {
        id: backendUser.email, // Use email as ID for simplicity
        username: backendUser.username || backendUser.email.split('@')[0],
        email: backendUser.email,
        role: backendUser.role === 'superadmin' ? 'superadmin' : 
              backendUser.role === 'admin' ? 'admin' : 'viewer',
        organization: backendUser.org_type || 'Unknown Organization'
      };

      // Fetch Grafana TEAM ID based on organization
      const grafanaData = await fetchTeamByOrganization(user.organization);

      return NextResponse.json({
        user: {
          ...user,
          grafanaTeamId: grafanaData.teamId,
        },
        token: backendUser.token, // Use backend token
      });

    } catch (backendError) {
      console.log('❌ FastAPI authentication failed');
      if (axios.isAxiosError(backendError)) {
        console.error('Backend error:', backendError.response?.data || backendError.message);
        const errorMessage = backendError.response?.data?.detail || 'Authentication failed';
        return NextResponse.json(
          { error: errorMessage },
          { status: backendError.response?.status || 401 }
        );
      } else {
        console.error('Backend error:', backendError);
        return NextResponse.json(
          { error: 'Authentication service unavailable' },
          { status: 503 }
        );
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
