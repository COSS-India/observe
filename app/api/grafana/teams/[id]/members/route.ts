import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://172.17.24.167:3000';
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || '';

// GET /api/grafana/teams/[id]/members - Get team members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;

    const response = await axios.get(
      `${GRAFANA_URL}/api/teams/${teamId}/members`,
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
    console.error('Error fetching team members:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to fetch team members', 
        details: err.response?.data?.message || err.message 
      },
      { status: err.response?.status || 500 }
    );
  }
}

// POST /api/grafana/teams/[id]/members - Add user to team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const response = await axios.post(
      `${GRAFANA_URL}/api/teams/${teamId}/members`,
      { userId },
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
    console.error('Error adding team member:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to add team member', 
        details: err.response?.data?.message || err.message 
      },
      { status: err.response?.status || 500 }
    );
  }
}
