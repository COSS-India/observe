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

// GET /api/grafana/dashboards - List all dashboards or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const tag = searchParams.get('tag') || '';
    const folderUids = searchParams.get('folderUids') || '';
    const folderIds = searchParams.get('folderIds') || '';
    
    // The search API is organization-scoped by default
    // This works with Organization Admin permissions
    let url = '/api/search?type=dash-db';
    if (query) url += `&query=${encodeURIComponent(query)}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;
    if (folderUids) url += `&folderUids=${encodeURIComponent(folderUids)}`;
    if (folderIds) url += `&folderIds=${encodeURIComponent(folderIds)}`;
    
    const response = await grafanaClient.get(url);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch dashboards';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: error.response?.status === 403 
            ? 'Your Grafana API key lacks the required permissions to search dashboards.'
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
