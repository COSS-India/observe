import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://172.17.24.167:3000';
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || '';

// GET /api/grafana/orgs/[id]/users - Get organization users
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = params.id;

    const response = await axios.get(
      `${GRAFANA_URL}/api/orgs/${orgId}/users`,
      {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('Error fetching organization users:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to fetch organization users', 
        details: err.response?.data?.message || err.message 
      },
      { status: err.response?.status || 500 }
    );
  }
}

// POST /api/grafana/orgs/[id]/users - Add user to organization
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = params.id;
    const body = await request.json();
    const { loginOrEmail, role } = body;

    if (!loginOrEmail || !role) {
      return NextResponse.json(
        { error: 'loginOrEmail and role are required' },
        { status: 400 }
      );
    }

    const response = await axios.post(
      `${GRAFANA_URL}/api/orgs/${orgId}/users`,
      { loginOrEmail, role },
      {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('Error adding user to organization:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to add user to organization', 
        details: err.response?.data?.message || err.message 
      },
      { status: err.response?.status || 500 }
    );
  }
}
