import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_ADMIN_USER = process.env.GRAFANA_ADMIN_USER || 'admin';
const GRAFANA_ADMIN_PASSWORD = process.env.GRAFANA_ADMIN_PASSWORD || 'password';

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  auth: {
    username: GRAFANA_ADMIN_USER,
    password: GRAFANA_ADMIN_PASSWORD,
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

interface Folder {
  uid: string;
  title: string;
  [key: string]: unknown;
}

// GET /api/grafana/folders - List all folders
export async function GET() {
  try {
    // Folders API is organization-scoped by default
    const response = await grafanaClient.get('/api/folders');
    
    // Filter out the "General" folder (uid is empty string or "general")
    const folders = Array.isArray(response.data) 
      ? response.data.filter((folder: Folder) => 
          folder.uid !== '' && 
          folder.uid !== 'general' && 
          folder.title?.toLowerCase() !== 'general'
        )
      : [];
    
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch folders';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to list folders.'
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

// POST /api/grafana/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Folders API is organization-scoped by default
    const response = await grafanaClient.post('/api/folders', body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating folder:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to create folder';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to create folders.'
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
