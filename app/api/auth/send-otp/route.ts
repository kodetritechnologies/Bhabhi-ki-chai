import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email } = body;

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

    return NextResponse.json({
      success: true,
      message: 'OTP safaltapoorvak bhej diya gaya hai!',
      email: cleanEmail,
    });
  } catch (err: unknown) {
    console.error('Send OTP error:', err);
    return NextResponse.json(
      { success: false, error: 'OTP bhejne me samasya aayi.' },
      { status: 500 }
    );
  }
}
