import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email aur OTP dono zaroori hain!' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // Development mode check: OTP must be 1234
    if (cleanOtp !== '1234') {
      return NextResponse.json(
        { success: false, error: 'Galat OTP! Kripya sahi 4-digit OTP daalein (Dev Mode: 1234).' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: cleanEmail }).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User nahi mila. Kripya pehle register karein.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login safal raha! Garam Chai me aapka swagat hai.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '/images/default-avatar.png',
      },
    });
  } catch (err: unknown) {
    console.error('Verify OTP error:', err);
    return NextResponse.json(
      { success: false, error: 'OTP verification me error aayi.' },
      { status: 500 }
    );
  }
}
