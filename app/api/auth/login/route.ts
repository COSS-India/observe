import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

async function fetchTeamByOrganization(
  organizationName: string
): Promise<{ teamId?: number }> {
  try {
    console.log(`🔍 Looking for team matching organization: "${organizationName}"`);
    
    // Get all teams from Grafana
    const response = await axios.get(`${GRAFANA_URL}/api/teams/search`, {
      params: { 
        perpage: 1000,
      },
      headers: {
        'Authorization': `Bearer ${GRAFANA_API_KEY}`,
        'Content-Type': 'application/json',
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

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate captcha fields
    if (!captcha_text || !captcha_id) {
      return NextResponse.json(
        { error: 'Captcha verification is required' },
        { status: 400 }
      );
    }

    // Prepare signin data with real captcha
    const signinData = {
      email: username,
      password: password,
      captcha_text: captcha_text,
      captcha_id: captcha_id
    };

    // Call FastAPI backend for authentication
    const backendResponse = await axios.post(`${BACKEND_URL}/v1/signin`, signinData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const backendData = backendResponse.data;

    // Fetch Grafana TEAM ID based on organization
    const grafanaData = await fetchTeamByOrganization(backendData.org_type || 'default');

    // Transform backend response to frontend format
    const user = {
      id: backendData.email, // Using email as ID for now
      username: backendData.username,
      email: backendData.email,
      role: backendData.role,
      organization: backendData.org_type,
      grafanaTeamId: grafanaData.teamId,
      createdAt: new Date().toISOString(),
      // Additional backend fields
      userinfo: backendData.userinfo,
      user_type: backendData.user_type,
      is_external: backendData.is_external,
    };

    return NextResponse.json({
      user,
      token: backendData.token,
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle backend errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.detail || 'Authentication failed';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
