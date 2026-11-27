import { NextResponse, connection } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Admin } from '@/models/Admin';
import {
  ADMIN_COOKIE_NAME,
  getAdminSession,
  hashAdminPassword,
  signAdminToken,
  verifyAdminPassword,
} from '@/lib/adminAuth';

export async function GET() {
  await connection();
  try {
    await connectToDatabase();
    const session = await getAdminSession();
    const adminCount = await Admin.countDocuments();

    if (!session) {
      return NextResponse.json(
        { authenticated: false, needsSetup: adminCount === 0 },
        { status: 401 }
      );
    }

    const adminDoc = await Admin.findOne({ email: session.email, isActive: true })
      .select('name email role')
      .lean();

    if (!adminDoc) {
      return NextResponse.json(
        { authenticated: false, needsSetup: adminCount === 0 },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      needsSetup: false,
      admin: {
        id: adminDoc._id.toString(),
        name: adminDoc.name,
        email: adminDoc.email,
        role: adminDoc.role,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const action = body.action || 'login';
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const name = (body.name || 'Tapri Admin').trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email aur password dono zaroori hain' },
        { status: 400 }
      );
    }

    // First-time dynamic admin setup (only allowed when admins collection is empty)
    if (action === 'setup') {
      const existingCount = await Admin.countDocuments();
      if (existingCount > 0) {
        return NextResponse.json(
          { success: false, error: 'Admin account pehle se maujood hai. Login karein.' },
          { status: 403 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password kam se kam 6 characters ka hona chahiye' },
          { status: 400 }
        );
      }

      const passwordHash = await hashAdminPassword(password);
      const createdAdmin = await Admin.create({
        name: name || 'Tapri Admin',
        email,
        passwordHash,
        role: 'super_admin',
        isActive: true,
        lastLoginAt: new Date(),
      });

      const token = signAdminToken(createdAdmin.email, createdAdmin._id.toString());
      const response = NextResponse.json({
        success: true,
        admin: {
          id: createdAdmin._id.toString(),
          name: createdAdmin.name,
          email: createdAdmin.email,
          role: createdAdmin.role,
        },
      });

      response.cookies.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // Standard DB-backed admin login
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Galat admin email ya password hai' },
        { status: 401 }
      );
    }

    const isValid = await verifyAdminPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Galat admin email ya password hai' },
        { status: 401 }
      );
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = signAdminToken(admin.email, admin._id.toString());
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
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
