import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

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

    // Create new customer/user
    const newUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      avatar: '/images/default-avatar.png',
      notificationPreferences: {
        inApp: true,
        browserPush: true,
        dutyReminders: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account safaltapoorvak ban gaya! Ab OTP daal kar login karein.',
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
