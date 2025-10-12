import { NextRequest, NextResponse } from 'next/server';
import { getDemoUsers, type DemoUser } from '@/lib/utils/demo-users';
import grafanaClient from '@/lib/grafana-client';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9010';

// Simple authentication - replace with your actual authentication logic
const DEMO_USERS: DemoUser[] = getDemoUsers();

async function fetchOrgByOrganization(
  organizationName: string
): Promise<{ orgId?: number }> {
  try {
    console.log(`🔍 Looking for organization matching: "${organizationName}"`);
    
    // Get all organizations from Grafana
    const response = await grafanaClient.get('/api/orgs', {
      params: { 
        perpage: 1000,
      },
    });

    const orgs = response.data || [];
    console.log(`📋 Found ${orgs.length} total organizations in Grafana`);
    
    // Find organization with matching name (case-insensitive)
    const matchingOrg = orgs.find((o: { name: string; id: number }) => 
      o.name.toLowerCase() === organizationName.toLowerCase()
    );

    if (matchingOrg) {
      console.log(`✅ Organization found! Name: "${matchingOrg.name}", ID: ${matchingOrg.id}`);
      return { orgId: matchingOrg.id };
    }

    console.warn(`❌ No organization found with name "${organizationName}"`);
    return { orgId: undefined };
  } catch (error) {
    console.error('❌ Error fetching organization:', error);
    return { orgId: undefined };
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
          username: (backendUser.username || backendUser.email.split('@')[0]).trim(),
          email: backendUser.email,
          role: backendUser.role === 'superadmin' ? 'superadmin' : 
                backendUser.role === 'admin' ? 'admin' : 'viewer',
          organization: backendUser.username?.trim() || backendUser.email.split('@')[0].trim() || 'Unknown Organization'
        };

        // Fetch Grafana ORG ID based on organization
        const grafanaData = await fetchOrgByOrganization(user.organization);

        return NextResponse.json({
          user: {
            ...user,
            grafanaOrgId: grafanaData.orgId,
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

    // Fetch Grafana ORG ID based on organization (NO team-based mapping)
    const grafanaData = await fetchOrgByOrganization(user.organization);

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        grafanaOrgId: grafanaData.orgId, // ONLY organization-based access
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
