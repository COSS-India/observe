import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// Validate environment variables
if (!GRAFANA_URL || !GRAFANA_API_KEY) {
  console.error('Missing required environment variables: NEXT_PUBLIC_GRAFANA_URL or GRAFANA_API_KEY');
}

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(),
});

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
export async function GET() {
  try {
    if (!GRAFANA_URL || !GRAFANA_API_KEY) {
      return NextResponse.json(
        { error: 'Grafana configuration is missing. Please configure NEXT_PUBLIC_GRAFANA_URL and GRAFANA_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Use organization-scoped endpoint instead of global /api/users
    // This works with Organization Admin permissions
    const response = await grafanaClient.get<OrgUser[]>('/api/org/users');
    
    // Transform org users to GrafanaUser format (userId -> id)
    const users = response.data.map((user) => ({
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
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.response?.data,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions. Please ensure it has "users:read" permission.'
            : undefined
        },
        { status: error.response?.status || 500 }
      );
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
    if (!GRAFANA_URL || !GRAFANA_API_KEY) {
      return NextResponse.json(
        { error: 'Grafana configuration is missing. Please configure NEXT_PUBLIC_GRAFANA_URL and GRAFANA_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Note: Creating users requires Server Admin permissions
    // With Organization Admin permissions, we can only:
    // 1. Add existing users to the organization
    // 2. Invite users via email (if SMTP is configured)
    // For now, we'll try the admin endpoint and let Grafana return appropriate error
    const response = await grafanaClient.post('/api/admin/users', body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating user:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create user';
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.response?.data,
          hint: error.response?.status === 403 
            ? 'Creating users requires Server Admin permissions. With Organization Admin, you can only add existing users to the organization.'
            : undefined
        },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
