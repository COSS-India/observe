import { NextResponse } from 'next/server';

export async function POST() {
  // In production, invalidate the token/session here
  return NextResponse.json({ message: 'Logged out successfully' });
}
