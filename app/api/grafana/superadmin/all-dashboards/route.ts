import { NextResponse } from 'next/server';

// TODO: Implement superadmin all-dashboards endpoint
export async function GET() {
  return NextResponse.json(
    { error: 'Not implemented yet' },
    { status: 501 }
  );
}
