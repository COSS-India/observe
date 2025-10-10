import { NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

export async function GET() {
  try {
    // Check if environment variables are set
    if (!GRAFANA_URL) {
      return NextResponse.json({
        status: 'error',
        message: 'NEXT_PUBLIC_GRAFANA_URL is not configured',
        config: {
          GRAFANA_URL: 'NOT SET',
          API_KEY: GRAFANA_API_KEY ? 'SET (hidden)' : 'NOT SET'
        }
      }, { status: 500 });
    }

    if (!GRAFANA_API_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'GRAFANA_API_KEY is not configured',
        config: {
          GRAFANA_URL: GRAFANA_URL,
          API_KEY: 'NOT SET'
        }
      }, { status: 500 });
    }

    // Try to connect to Grafana
    const grafanaClient = axios.create({
      baseURL: GRAFANA_URL,
      headers: {
        'Authorization': `Bearer ${GRAFANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Test connection by fetching current org
    const response = await grafanaClient.get('/api/org');

    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Grafana',
      config: {
        GRAFANA_URL: GRAFANA_URL,
        API_KEY: `${GRAFANA_API_KEY.substring(0, 10)}...`,
      },
      grafana: {
        orgName: response.data.name,
        orgId: response.data.id,
      }
    });

  } catch (error) {
    console.error('Grafana health check failed:', error);
    
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to Grafana',
        config: {
          GRAFANA_URL: GRAFANA_URL,
          API_KEY: GRAFANA_API_KEY ? `${GRAFANA_API_KEY.substring(0, 10)}...` : 'NOT SET',
        },
        error: {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          code: error.code,
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'error',
      message: 'Unknown error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
