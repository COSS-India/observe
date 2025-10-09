import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3000';
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || '';

// DELETE /api/grafana/teams/[id]/members/[userId] - Remove user from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: teamId, userId } = await params;

    const response = await axios.delete(
      `${GRAFANA_URL}/api/teams/${teamId}/members/${userId}`,
      {
      headers: getGrafanaAuthHeaders(),
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('Error removing team member:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to remove team member', 
        details: err.response?.data?.message || err.message 
      },
      { status: err.response?.status || 500 }
    );
  }
}
