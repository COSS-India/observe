import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// Interface for org user response from Grafana
interface OrgUser {
  userId: number;
  email: string;
  name: string;
  login: string;
  role: string;
  theme?: string;
  orgId: number;
  isDisabled?: boolean;
  isExternal?: boolean;
  authLabels?: string[];
  updatedAt?: string;
  createdAt?: string;
  avatarUrl?: string;
}

// GET /api/grafana/users - List all users
export async function GET(request: NextRequest) {
  try {
    // Validate configuration
    const validation = validateGrafanaConfig();
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Grafana configuration is invalid',
        errors: validation.errors
      }, { status: 500 });
    }

    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // Use organization-scoped endpoint instead of global /api/users
    // This works with Organization Admin permissions
    const response = await grafanaClient.get<OrgUser[]>('/api/org/users');
    
    // Transform org users to GrafanaUser format (userId -> id)
    const users = response.data.map((user: OrgUser) => ({
      id: user.userId,
      email: user.email,
      name: user.name,
      login: user.login,
      theme: user.theme || '',
      orgId: user.orgId,
      isGrafanaAdmin: user.role === 'Admin',
      isDisabled: user.isDisabled || false,
      isExternal: user.isExternal || false,
      authLabels: user.authLabels || [],
      updatedAt: user.updatedAt || '',
      createdAt: user.createdAt || '',
      avatarUrl: user.avatarUrl || '',
      role: user.role,
    }));
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch users';
      
      // Provide helpful hints based on error type
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions. Ensure Server Admin or Organization Admin role.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
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

// POST /api/grafana/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    const validation = validateGrafanaConfig();
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Grafana configuration is invalid',
        errors: validation.errors
      }, { status: 500 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    console.log(`🔄 Creating user: ${body.email || body.login}${orgId ? ` in organization ${orgId}` : ''}`);
    
    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });
    
    // Switch to organization context if provided
    if (orgId) {
      await grafanaClient.post(`/api/user/using/${orgId}`);
    }
    
    // Note: Creating users requires Server Admin permissions
    const response = await grafanaClient.post('/api/admin/users', body);
    
    console.log(`✅ User created successfully: ${body.email || body.login} (ID: ${response.data.id})`);
    
    // If orgId is provided, add the user to that organization
    if (orgId && response.data.id) {
      try {
        console.log(`🔄 Adding user ${response.data.id} to organization ${orgId}`);
        await grafanaClient.post(`/api/orgs/${orgId}/users`, {
          loginOrEmail: body.email || body.login,
          role: body.role || 'Viewer',
        });
        console.log(`✅ User added to organization ${orgId}`);
      } catch (addOrgError) {
        console.warn('User created but failed to add to organization:', addOrgError);
        // Don't fail the entire request, user was created successfully
      }
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating user:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create user';
      
      // Provide helpful hints based on error type
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Creating users requires Server Admin permissions. Use Basic Auth or ensure your API key has Server Admin role.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
      } else if (error.response?.status === 409) {
        hint = 'User already exists. Try updating the existing user or use a different login/email.';
      } else if (error.response?.status === 412) {
        hint = 'Precondition failed. This usually means a user with this email or login already exists, or required fields are missing/invalid.';
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
