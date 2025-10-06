import { NextRequest, NextResponse } from 'next/server';

// Simple authentication - replace with your actual authentication logic
const DEMO_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    role: 'admin' as const,
  },
  {
    id: '2',
    username: 'viewer',
    password: 'viewer123',
    email: 'viewer@example.com',
    role: 'viewer' as const,
  },
  {
    id: '3',
    username: 'Karmayogi Bharat',
    password: 'karmayogi',
    email: 'karmayogi@karmayogi.com',
    role: 'admin' as const,
  },
];

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Find user
    const user = DEMO_USERS.find(
      (u) => u.email === username && u.password === password
    );
    console.log(user)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create token (in production, use JWT or similar)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
