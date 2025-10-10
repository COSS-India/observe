import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

interface GrafanaUser {
  id: number;
  email: string;
  name: string;
  login: string;
  theme: string;
  orgId: number;
  isGrafanaAdmin: boolean;
  isDisabled: boolean;
  isExternal: boolean;
  authLabels: string[] | null;
  updatedAt: string;
  createdAt: string;
  avatarUrl: string;
}

// GET /api/grafana/users/lookup?loginOrEmail=user@example.com - Lookup user by email or login
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loginOrEmail = searchParams.get('loginOrEmail');
    const orgId = searchParams.get('orgId');

    if (!loginOrEmail) {
      return NextResponse.json(
        { error: 'loginOrEmail parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking up user: ${loginOrEmail}`);
    
    // Get auth headers (supports both Basic Auth and API Key)
    const headers = getGrafanaAuthHeaders(orgId ? parseInt(orgId) : undefined);

    // Use Grafana's lookup API: GET /api/users/lookup?loginOrEmail=
    console.log(`📞 Calling GET ${GRAFANA_URL}/api/users/lookup?loginOrEmail=${loginOrEmail}`);
    const response = await axios.get<GrafanaUser>(
      `${GRAFANA_URL}/api/users/lookup`,
      {
        params: { loginOrEmail },
        headers
      }
    );

    console.log(`✅ Found user:`, {
      id: response.data.id,
      email: response.data.email,
      login: response.data.login,
      name: response.data.name,
      orgId: response.data.orgId
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('❌ Error looking up user:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to lookup user';
      return NextResponse.json(
        {
          error: errorMessage,
          details: error.response?.data,
          hint: error.response?.status === 403
            ? 'Your Grafana API key lacks the required permissions.'
            : error.response?.status === 404
            ? 'User not found with that email or login.'
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

