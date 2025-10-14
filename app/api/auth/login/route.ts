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

        // Extract user ID from JWT token
        let userId = null;
        if (backendUser.token) {
          try {
            // Decode JWT token to get user ID (sub field)
            const tokenPayload = JSON.parse(Buffer.from(backendUser.token.split('.')[1], 'base64').toString());
            userId = tokenPayload.sub;
            console.log(`🔍 Extracted user ID from token: ${userId}`);
          } catch (tokenError) {
            console.error('❌ Error decoding token:', tokenError);
          }
        }

        // Fetch complete user details using the user ID
        let userDetails = null;
        if (userId) {
          try {
            console.log(`🔄 Fetching user details for ID: ${userId}`);
            const userDetailsResponse = await axios.get(`${BACKEND_URL}/v1/users/${userId}`);
            userDetails = userDetailsResponse.data;
            console.log('✅ User details fetched successfully:', {
              orgName: userDetails.org?.org_name,
              orgType: userDetails.org?.org_type
            });
          } catch (userError) {
            console.error('❌ Error fetching user details:', userError);
          }
        }
        console.log("User details",backendUser)
        // Extract organization name from user details or fallback to backend user data
        const organizationName = userDetails?.org?.org_name || 
                                backendUser.organization || 
                                backendUser.org?.org_name || 
                                'Unknown Organization';
        
        console.log('🏢 Organization mapping:', {
          fromUserDetails: userDetails?.org?.org_name,
          fromBackendUser: backendUser.organization,
          fromBackendUserOrg: backendUser.org?.org_name,
          finalOrganization: organizationName,
          orgType: userDetails?.org?.org_type || backendUser.org_type
        });

        // Map backend user to frontend format
        const user = {
          id: backendUser.email, // Use email as ID for simplicity
          username: backendUser.username || backendUser.email.split('@')[0],
          email: backendUser.email,
          role: backendUser.role === 'superadmin' ? 'superadmin' : 
                backendUser.role === 'admin' ? 'admin' : 'viewer',
          organization: organizationName,
          orgType: userDetails?.org?.org_type || backendUser.org_type,
          userType: userDetails?.user_type || [],
          firstName: userDetails?.first_name || backendUser.first_name,
          lastName: userDetails?.last_name || backendUser.last_name,
          designation: userDetails?.designation,
          status: userDetails?.status
        };

        // Fetch Grafana TEAM ID based on organization name
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
