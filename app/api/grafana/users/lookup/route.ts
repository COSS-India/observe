import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/users/lookup - Find user by email or login
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

    const { searchParams } = new URL(request.url);
    const loginOrEmail = searchParams.get('loginOrEmail');
    const orgId = searchParams.get('orgId');

    if (!loginOrEmail) {
      return NextResponse.json({
        error: 'loginOrEmail parameter is required'
      }, { status: 400 });
    }

    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // Use the Grafana user lookup endpoint
    const response = await grafanaClient.get(`/api/users/lookup?loginOrEmail=${encodeURIComponent(loginOrEmail)}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error looking up user:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to lookup user';
      
      // Provide helpful hints based on error type
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions for user lookup.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
      } else if (error.response?.status === 404) {
        hint = 'User not found with the provided login or email.';
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
