import { NextRequest, NextResponse } from 'next/server';
import { getDemoUsers, type DemoUser } from '@/lib/utils/demo-users';
import grafanaClient from '@/lib/grafana-client';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9010';

// Simple authentication - replace with your actual authentication logic
const DEMO_USERS: DemoUser[] = getDemoUsers();

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

    // First try FastAPI backend authentication
    if (captcha_text && captcha_id) {
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
        console.log('❌ FastAPI authentication failed, falling back to demo users');
        if (axios.isAxiosError(backendError)) {
          console.error('Backend error:', backendError.response?.data || backendError.message);
        } else {
          console.error('Backend error:', backendError);
        }
        
        // If backend auth fails, continue to demo user authentication below
      }
    }

    // Fallback to demo users authentication
    console.log('🔄 Attempting demo user authentication...');
    const user = DEMO_USERS.find(
      (u) => u.email === username && u.password === password
    );
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('✅ Demo user authentication successful:', user.email);

    // Create token (in production, use JWT or similar)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    // Fetch Grafana TEAM ID based on organization (NO user-based mapping)
    const grafanaData = await fetchTeamByOrganization(user.organization);

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        grafanaTeamId: grafanaData.teamId, // ONLY team-based access
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
