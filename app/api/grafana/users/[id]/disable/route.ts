import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(),
});

// POST /api/grafana/users/[id]/disable - Disable user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Disable user using server admin endpoint
    // Note: This requires Server Admin permissions, not just Org Admin
    const response = await grafanaClient.post(`/api/admin/users/${id}/disable`);
    
    return NextResponse.json({
      message: 'User disabled successfully',
      ...response.data
    });
  } catch (error) {
    console.error('Error disabling user:', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || 'Failed to disable user';
      
      // Add hint for permission errors
      if (status === 403) {
        return NextResponse.json(
          { 
            error: message,
            hint: 'This operation requires Server Admin permissions. You may only have Org Admin permissions.'
          },
          { status }
        );
      }
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
