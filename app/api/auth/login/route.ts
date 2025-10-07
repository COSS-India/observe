import { NextRequest, NextResponse } from 'next/server';
import { getDemoUsers, type DemoUser } from '@/lib/utils/demo-users';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

// Simple authentication - replace with your actual authentication logic
const DEMO_USERS: DemoUser[] = getDemoUsers();

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
    const { username, password } = await request.json();

    // Find user
    const user = DEMO_USERS.find(
      (u) => u.email === username && u.password === password
    );
    console.log(user)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

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
