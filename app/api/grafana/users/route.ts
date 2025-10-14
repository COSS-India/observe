import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

// Validate environment variables
if (!GRAFANA_URL || !GRAFANA_API_KEY) {
  console.error('Missing required environment variables: NEXT_PUBLIC_GRAFANA_URL or GRAFANA_API_KEY');
}

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  headers: {
    'Authorization': `Bearer ${GRAFANA_API_KEY}`,
    'Content-Type': 'application/json',
  },
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
    
    // Validate required fields
    if (!body.name || !body.email || !body.login || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields. Name, email, login, and password are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }
    
    // Note: Creating users requires Server Admin permissions
    // With Organization Admin permissions, we can only:
    // 1. Add existing users to the organization
    // 2. Invite users via email (if SMTP is configured)
    // For now, we'll try the admin endpoint and let Grafana return appropriate error
    const response = await grafanaClient.post('/api/admin/users', body);
    
    return NextResponse.json({
      ...response.data,
      message: 'User created successfully'
    }, { status: 201 });
  } catch (error) {
    // Log error details for debugging (this is just for server logs)
    if (axios.isAxiosError(error)) {
      console.error('Grafana API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
    } else {
      console.error('Unexpected error creating user:', error);
    }

    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.error || 'Failed to create user';
      const statusCode = error.response?.status || 500;
      
      // Handle specific Grafana error cases
      let userFriendlyMessage = errorMessage;
      let hint: string | undefined;

      if (statusCode === 412 || errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('user already exists')) {
        // Duplicate user error
        userFriendlyMessage = 'A user with this email or login already exists.';
        hint = 'Please use a different email address or login username.';
        console.log('→ Sending duplicate user error response');
      } else if (statusCode === 409 || errorMessage.toLowerCase().includes('conflict')) {
        // Conflict error
        userFriendlyMessage = 'A user with this information already exists.';
        hint = 'Please check if the email or login is already in use.';
        console.log('→ Sending conflict error response');
      } else if (statusCode === 403) {
        // Permission error
        userFriendlyMessage = 'Insufficient permissions to create users.';
        hint = 'Creating users requires Server Admin permissions. Your current API key only has Organization Admin access.';
        console.log('→ Sending permission error response');
      } else if (statusCode === 400) {
        // Bad request - validation errors
        if (errorMessage.toLowerCase().includes('email')) {
          userFriendlyMessage = 'Invalid email address format.';
          hint = 'Please provide a valid email address.';
        } else if (errorMessage.toLowerCase().includes('password')) {
          userFriendlyMessage = 'Invalid password.';
          hint = 'Password must be at least 8 characters long and meet security requirements.';
        } else if (errorMessage.toLowerCase().includes('login')) {
          userFriendlyMessage = 'Invalid login username.';
          hint = 'Login username must not contain special characters or spaces.';
        } else {
          userFriendlyMessage = errorMessage;
        }
        console.log('→ Sending validation error response');
      } else if (statusCode === 500) {
        userFriendlyMessage = 'Server error occurred while creating user.';
        hint = 'Please try again later or contact your administrator.';
        console.log('→ Sending server error response');
      }

      console.log('→ Response payload:', { 
        error: userFriendlyMessage,
        hint,
        status: statusCode
      });

      return NextResponse.json(
        { 
          error: userFriendlyMessage,
          details: errorData,
          hint: hint,
          originalError: errorMessage
        },
        { status: statusCode }
      );
    }
    
    console.error('→ Non-axios error, sending generic error response');
    return NextResponse.json(
      { error: 'Internal server error occurred while creating user.' },
      { status: 500 }
    );
  }
}
