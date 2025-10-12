import { NextResponse } from 'next/server';
import axios from 'axios';
import { getGrafanaAuthHeaders, getGrafanaConfig, validateGrafanaConfig } from '@/lib/utils/grafana-auth';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;

export async function GET() {
  try {
    // Validate configuration
    const validation = validateGrafanaConfig();
    const config = getGrafanaConfig();
    
    if (!validation.isValid) {
      return NextResponse.json({
        status: 'error',
        message: 'Grafana configuration is invalid',
        errors: validation.errors,
        config
      }, { status: 500 });
    }

    // Try to connect to Grafana
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: getGrafanaAuthHeaders(),
      timeout: 10000, // 10 second timeout
    });

    // Test connection by fetching current org
    const response = await grafanaClient.get('/api/org');

    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Grafana',
      config: config,
      grafana: {
        orgName: response.data.name,
        orgId: response.data.id,
      }
    });

  } catch (error) {
    console.error('Grafana health check failed:', error);
    
    if (axios.isAxiosError(error)) {
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
      };

      // Provide helpful hints based on error type
      let hint = '';
      if (error.response?.status === 401) {
        hint = 'Authentication failed. Check your GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY';
      } else if (error.response?.status === 403) {
        hint = 'Access denied. Your Grafana API key may lack Server Admin permissions';
      } else if (error.code === 'ECONNREFUSED') {
        hint = 'Cannot connect to Grafana. Check if NEXT_PUBLIC_GRAFANA_URL is correct and Grafana is running';
      }

      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to Grafana',
        config: getGrafanaConfig(),
        error: errorDetails,
        hint
      }, { status: error.response?.status || 500 });
    }

    return NextResponse.json({
      status: 'error',
      message: 'Unknown error occurred',
      config: getGrafanaConfig(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
