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

// GET /api/grafana/folders/[uid]/permissions - Get folder permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const response = await grafanaClient.get(`/api/folders/${uid}/permissions`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching folder permissions:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to fetch folder permissions' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/grafana/folders/[uid]/permissions - Update folder permissions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const body = await request.json();
    
    const response = await grafanaClient.post(`/api/folders/${uid}/permissions`, body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating folder permissions:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to update folder permissions';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to manage folder permissions.'
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
