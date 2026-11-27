import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { generateFourDigitOtp, isDevelopmentMode, sendOtpEmail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, isResend = false } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address zaroori hai!' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Is email se koi account nahi mila. Kripya pehle Create Account karein.',
          notFound: true,
        },
        { status: 404 }
      );
    }

    const otpCode = generateFourDigitOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendOtpEmail({
      to: cleanEmail,
      name: user.name,
      otp: otpCode,
      isResend: Boolean(isResend),
    });

    const isDev = isDevelopmentMode();
    return NextResponse.json({
      success: true,
      message: isDev
        ? isResend
          ? 'Naya OTP resend ho gaya hai (Dev Mode: 1234)!'
          : 'OTP ready hai (Dev Mode: 1234)!'
        : isResend
        ? 'Naya OTP aapke email par resend kar diya gaya hai!'
        : 'OTP aapke email par safaltapoorvak bhej diya gaya hai!',
      email: cleanEmail,
    });
  } catch (err: unknown) {
    console.error('Send OTP error:', err);
    return NextResponse.json(
      { success: false, error: 'OTP bhejne me samasya aayi. Kripya punah koshish karein.' },
      { status: 500 }
    );
  }
}
