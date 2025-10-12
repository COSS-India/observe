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

async function fetchGrafanaUserByEmail(
  email: string,
  orgId?: number
): Promise<{ userId?: number }> {
  try {
    console.log(`🔍 Looking up Grafana user by email: "${email}"${orgId ? ` in org ${orgId}` : ''}`);
    
    // Use Grafana's user lookup endpoint
    const lookupUrl = `/api/users/lookup?loginOrEmail=${encodeURIComponent(email)}`;
    const response = await grafanaClient.get(lookupUrl);

    if (response.data && response.data.id) {
      console.log(`✅ Grafana user found! Email: "${email}", ID: ${response.data.id}, Login: ${response.data.login}`);
      return { userId: response.data.id };
    }

    console.warn(`❌ No Grafana user found with email "${email}"`);
    return { userId: undefined };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(`⚠️ Grafana user not found for email "${email}"`);
    } else {
      console.error('❌ Error fetching Grafana user:', error);
    }
    return { userId: undefined };
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

        // Decode JWT token to get user ID (token payload contains: { sub: userId, email, role })
        let userId: string | null = null;
        try {
          const tokenPayload = backendUser.token.split('.')[1];
          const decodedPayload = JSON.parse(Buffer.from(tokenPayload, 'base64').toString());
          userId = decodedPayload.sub;
          console.log('✅ User ID extracted from token:', userId);
        } catch (decodeError) {
          console.warn('⚠️ Failed to decode JWT token:', decodeError);
        }

        // Fetch full user details including organization if we have userId
        let userDetails;
        if (userId) {
          try {
            const userDetailsResponse = await axios.get(`${BACKEND_URL}/v1/users/${userId}`, {
              headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${backendUser.token}`,
              },
            });
            userDetails = userDetailsResponse.data;
            console.log('✅ User details fetched:', { org: userDetails.org?.org_name });
          } catch (detailsError) {
            console.warn('⚠️ Failed to fetch user details, using basic info', detailsError);
            userDetails = null;
          }
        }

        // Map backend user to frontend format
        const user = {
          id: userId || backendUser.email, // Use userId from token or fall back to email
          username: (backendUser.username || backendUser.email.split('@')[0]).trim(),
          email: backendUser.email,
          role: backendUser.role === 'superadmin' ? 'superadmin' : 
                backendUser.role === 'admin' ? 'admin' : 'viewer',
          organization: userDetails?.org?.org_name || backendUser.username?.trim() || backendUser.email.split('@')[0].trim() || 'Unknown Organization',
          // Add extended user details if available
          ...(userDetails && {
            firstName: userDetails.first_name,
            lastName: userDetails.last_name,
            designation: userDetails.designation,
            gender: userDetails.gender,
            personalEmail: userDetails.personal_email,
            phone: userDetails.phone,
            org: userDetails.org,
            status: userDetails.status,
            userType: userDetails.user_type,
            productAccess: userDetails.product_access,
            isFresh: userDetails.is_fresh,
            isProfileUpdated: userDetails.is_profile_updated,
          }),
        };

        // Fetch Grafana ORG ID based on organization
        const grafanaData = await fetchOrgByOrganization(user.organization);

        // For non-super admin users, fetch Grafana user ID for permission-based access
        let grafanaUserId: number | undefined;
        if (user.role !== 'superadmin' && grafanaData.orgId) {
          const grafanaUserData = await fetchGrafanaUserByEmail(user.email, grafanaData.orgId);
          grafanaUserId = grafanaUserData.userId;
          
          if (!grafanaUserId) {
            console.warn(`⚠️ User ${user.email} not found in Grafana. They may not see any dashboards.`);
          }
        }

        return NextResponse.json({
          user: {
            ...user,
            grafanaOrgId: grafanaData.orgId,
            grafanaUserId: grafanaUserId,
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

    // Fetch Grafana ORG ID based on organization
    const grafanaData = await fetchOrgByOrganization(user.organization);

    // For non-super admin users, fetch Grafana user ID for permission-based access
    let grafanaUserId: number | undefined;
    if (user.role !== 'superadmin' && grafanaData.orgId) {
      const grafanaUserData = await fetchGrafanaUserByEmail(user.email, grafanaData.orgId);
      grafanaUserId = grafanaUserData.userId;
      
      if (!grafanaUserId) {
        console.warn(`⚠️ User ${user.email} not found in Grafana. They may not see any dashboards.`);
      }
    }

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        grafanaOrgId: grafanaData.orgId,
        grafanaUserId: grafanaUserId,
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
