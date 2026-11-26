import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  getAdminCredentials,
  getAdminSession,
  signAdminToken,
} from '@/lib/adminAuth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, admin: session });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    const creds = getAdminCredentials();
    if (email !== creds.email || password !== creds.password) {
      return NextResponse.json(
        { success: false, error: 'Galat admin email ya password hai' },
        { status: 401 }
      );
    }

    const token = signAdminToken(creds.email);
    const response = NextResponse.json({
      success: true,
      admin: { email: creds.email },
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
