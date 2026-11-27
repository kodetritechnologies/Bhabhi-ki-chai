import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import {
  generateFourDigitOtp,
  sendNewUserAdminNotification,
  sendOtpEmail,
} from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Naam aur email dono zaroori hain!' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Yeh email pehle se registered hai! Kripya Login karein.',
          isExisting: true,
        },
        { status: 409 }
      );
    }

    const otpCode = generateFourDigitOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new customer/user
    const newUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      otpCode,
      otpExpiresAt,
      avatar: '/images/default-avatar.png',
      notificationPreferences: {
        inApp: true,
        browserPush: true,
        dutyReminders: true,
      },
    });

    // Send admin notification email & initial login OTP email in parallel
    const mailResults = await Promise.allSettled([
      sendNewUserAdminNotification({
        name: cleanName,
        email: cleanEmail,
        createdAt: newUser.createdAt,
      }),
      sendOtpEmail({
        to: cleanEmail,
        name: cleanName,
        otp: otpCode,
        isResend: false,
      }),
    ]);

    mailResults.forEach((res, idx) => {
      if (res.status === 'rejected') {
        console.error(
          idx === 0 ? 'Admin registration notification email failed:' : 'Initial OTP email failed:',
          res.reason
        );
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Account safaltapoorvak ban gaya! Aapke email par 4-digit OTP bhej diya gaya hai.',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
      },
    });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { success: false, error: 'Registration me samasya aayi. Kripya punah prayas karein.' },
      { status: 500 }
    );
  }
}
