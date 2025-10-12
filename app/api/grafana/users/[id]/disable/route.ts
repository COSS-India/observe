import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// POST /api/grafana/users/[id]/disable - Disable user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate configuration
    const validation = validateGrafanaConfig();
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Grafana configuration is invalid',
        errors: validation.errors
      }, { status: 500 });
    }

    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get organization ID from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    console.log(`🔄 Disabling user ${id}${orgId ? ` in organization context ${orgId}` : ''}`);

    // Create Grafana client with proper auth and optional organization context
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // Switch to organization context if provided
    if (orgId) {
      await grafanaClient.post(`/api/user/using/${orgId}`);
    }

    // Disable user using server admin endpoint
    // Note: This requires Server Admin permissions, not just Org Admin
    const response = await grafanaClient.post(`/api/admin/users/${id}/disable`);
    
    console.log(`✅ User ${id} disabled successfully`);
    
    return NextResponse.json({
      message: 'User disabled successfully',
      ...response.data
    });
  } catch (error) {
    console.error('Error disabling user:', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || 'Failed to disable user';
      
      // Add helpful hints for different error types
      let hint = '';
      if (status === 403) {
        hint = 'This operation requires Server Admin permissions. You may only have Org Admin permissions.';
      } else if (status === 401) {
        hint = 'Authentication failed. Check your Grafana credentials.';
      } else if (status === 404) {
        hint = 'User not found or you do not have access to this user.';
      }
      
      return NextResponse.json(
        { 
          error: message,
          hint
        },
        { status }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
