import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userEmail = (searchParams.get('userEmail') || '').trim().toLowerCase();
    const user = userEmail
      ? await User.findOne({ email: userEmail })
      : await User.findOne({ email: 'rahul@example.com' });
    if (!user) return NextResponse.json({ success: true, notifications: [] });

    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ success: true, notifications });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { notificationId, markAll = false, userEmail = '' } = body;
    const cleanEmail = String(userEmail || '').trim().toLowerCase();
    const user = cleanEmail
      ? await User.findOne({ email: cleanEmail })
      : await User.findOne({ email: 'rahul@example.com' });

    if (markAll && user) {
      await Notification.updateMany({ userId: user._id }, { read: true });
    } else if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    }

    return NextResponse.json({ success: true, message: 'Updated notifications' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
