import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  headers: {
    'Authorization': `Bearer ${GRAFANA_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// GET /api/grafana/users/[id]/teams - Get teams for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Grafana API endpoint to get teams for a user
    const response = await grafanaClient.get(`/api/users/${id}/teams`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user teams';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to fetch user teams.'
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
