import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { isDevelopmentMode } from '@/lib/mailer';

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

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User nahi mila. Kripya pehle register karein.' },
        { status: 404 }
      );
    }

    const isDev = isDevelopmentMode();

    if (isDev) {
      if (cleanOtp !== '1234') {
        return NextResponse.json(
          { success: false, error: 'Galat OTP! Dev Mode me sahi OTP 1234 daalein.' },
          { status: 400 }
        );
      }
    } else {
      if (!user.otpCode || !user.otpExpiresAt) {
        return NextResponse.json(
          { success: false, error: 'Koi active OTP nahi mila. Kripya Resend OTP par click karein.' },
          { status: 400 }
        );
      }

      if (new Date() > new Date(user.otpExpiresAt)) {
        return NextResponse.json(
          { success: false, error: 'OTP expire ho gaya hai! Kripya Resend OTP karein.' },
          { status: 400 }
        );
      }

      if (cleanOtp !== user.otpCode) {
        return NextResponse.json(
          { success: false, error: 'Galat OTP! Kripya apna email check karke sahi 4-digit OTP daalein.' },
          { status: 400 }
        );
      }
    }

    // Clear used OTP
    await User.updateOne(
      { _id: user._id },
      { $unset: { otpCode: 1, otpExpiresAt: 1 } }
    );

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
