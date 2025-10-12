import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

// GET /api/grafana/dashboards - List all dashboards or search
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

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const tag = searchParams.get('tag') || '';
    const folderUids = searchParams.get('folderUids') || '';
    const folderIds = searchParams.get('folderIds') || '';
    const orgId = searchParams.get('orgId');
    
    // Create Grafana client with proper auth
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(orgId || undefined),
      timeout: 10000,
    });

    // The search API is organization-scoped by default
    let url = '/api/search?type=dash-db';
    if (query) url += `&query=${encodeURIComponent(query)}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;
    if (folderUids) url += `&folderUids=${encodeURIComponent(folderUids)}`;
    if (folderIds) url += `&folderIds=${encodeURIComponent(folderIds)}`;
    
    console.log('🔍 Fetching dashboards with URL:', url);
    const response = await grafanaClient.get(url);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch dashboards';
      
      // Provide helpful hints based on error type
      let hint = '';
      if (error.response?.status === 403) {
        hint = 'Your Grafana credentials lack the required permissions to search dashboards. Ensure proper viewer permissions or higher.';
      } else if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY.';
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
