import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const user = await User.findOne({ email: 'rahul@example.com' });
    if (!user) return NextResponse.json({ notifications: [] });

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
    const { notificationId, markAll = false } = body;
    const user = await User.findOne({ email: 'rahul@example.com' });

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
