import { NextRequest, NextResponse } from 'next/server';
import { getDemoUsers, type DemoUser } from '@/lib/utils/demo-users';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

// Simple authentication - replace with your actual authentication logic
const DEMO_USERS: DemoUser[] = getDemoUsers();

interface GrafanaOrganization {
  id: number;
  name: string;
}

interface GrafanaOrgUser {
  orgId: number;
  userId: number;
  email: string;
  login: string;
  role: string;
}

async function ensureGrafanaOrgAndUser(
  email: string,
  username: string,
  organizationName: string
): Promise<{ orgId: number; userId: number } | null> {
  try {
    // Step 1: Check if organization exists, create if not
    let organizations: GrafanaOrganization[] = [];
    
    try {
      const orgsResponse = await axios.get(`${GRAFANA_URL}/api/orgs`, {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      organizations = orgsResponse.data;
    } catch {
      console.warn('Could not fetch all organizations. May need Server Admin permissions.');
      return null;
    }

    let matchingOrg = organizations.find(
      (org) => org.name.toLowerCase() === organizationName.toLowerCase()
    );

    // Create organization if it doesn't exist
    if (!matchingOrg) {
      console.log(`Creating Grafana organization: ${organizationName}`);
      try {
        const createOrgResponse = await axios.post(
          `${GRAFANA_URL}/api/orgs`,
          { name: organizationName },
          {
            headers: {
              'Authorization': `Bearer ${GRAFANA_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const newOrgId = createOrgResponse.data.orgId;
        matchingOrg = { id: newOrgId, name: organizationName };
        console.log(`Created organization ${organizationName} with ID ${newOrgId}`);
      } catch (error) {
        console.error('Failed to create organization:', error);
        return null;
      }
    }

    // Step 2: Check if user exists globally
    let globalUserId: number | undefined;
    try {
      const userLookupResponse = await axios.get(
        `${GRAFANA_URL}/api/users/lookup`,
        {
          params: { loginOrEmail: email },
          headers: {
            'Authorization': `Bearer ${GRAFANA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      globalUserId = userLookupResponse.data?.id;
    } catch {
      console.log(`User ${email} not found globally, will create`);
    }

    // Step 3: If user doesn't exist globally, create them
    if (!globalUserId) {
      console.log(`Creating Grafana user: ${email}`);
      try {
        const createUserResponse = await axios.post(
          `${GRAFANA_URL}/api/admin/users`,
          {
            name: username,
            email: email,
            login: username,
            password: 'TempPass123!', // Temporary password
            OrgId: matchingOrg.id,
          },
          {
            headers: {
              'Authorization': `Bearer ${GRAFANA_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        globalUserId = createUserResponse.data.id;
        console.log(`Created user ${email} with ID ${globalUserId}`);
      } catch (error) {
        console.error('Failed to create user:', error);
        return null;
      }
    }

    // Step 4: Check if user is in the organization
    const orgUsersResponse = await axios.get(
      `${GRAFANA_URL}/api/orgs/${matchingOrg.id}/users`,
      {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const orgUsers: GrafanaOrgUser[] = orgUsersResponse.data;
    const userInOrg = orgUsers.find((u) => u.userId === globalUserId);

    // Step 5: Add user to organization if not already there
    if (!userInOrg) {
      console.log(`Adding user ${email} to organization ${organizationName}`);
      try {
        await axios.post(
          `${GRAFANA_URL}/api/orgs/${matchingOrg.id}/users`,
          {
            loginOrEmail: email,
            role: 'Admin', // Default role
          },
          {
            headers: {
              'Authorization': `Bearer ${GRAFANA_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`Added user ${email} to organization ${organizationName}`);
      } catch (error) {
        console.error('Failed to add user to organization:', error);
      }
    }

    return { orgId: matchingOrg.id, userId: globalUserId! };
  } catch (error) {
    console.error('Error in ensureGrafanaOrgAndUser:', error);
    return null;
  }
}

async function fetchGrafanaUserIdByOrganization(
  email: string,
  username: string,
  organizationName: string
): Promise<number | undefined> {
  try {
    // First, ensure organization and user exist, create if needed
    const result = await ensureGrafanaOrgAndUser(email, username, organizationName);
    
    if (result) {
      console.log(`Auto-configured Grafana user ${result.userId} in organization ${organizationName}`);
      return result.userId;
    }

    // Fallback to email lookup
    return await fetchGrafanaUserIdByEmail(email);
  } catch (error) {
    console.error('Error fetching Grafana user ID by organization:', error);
    return await fetchGrafanaUserIdByEmail(email);
  }
}

async function fetchGrafanaUserIdByEmail(email: string): Promise<number | undefined> {
  try {
    const response = await axios.get(`${GRAFANA_URL}/api/users/lookup`, {
      params: { loginOrEmail: email },
      headers: {
        'Authorization': `Bearer ${GRAFANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.data?.id;
  } catch (error) {
    console.error('Error fetching Grafana user ID by email:', error);
    return undefined;
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

    // Fetch Grafana user ID based on organization and email
    const grafanaUserId = await fetchGrafanaUserIdByOrganization(
      user.email,
      user.username,
      user.organization
    );

    // Determine if user is superadmin (only karmayogi has full Grafana API access)
    const isSuperAdmin = user.username.toLowerCase() === 'karmayogi';

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        grafanaUserId, // Automatically include Grafana user ID
        isSuperAdmin, // Flag to indicate superadmin status
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
