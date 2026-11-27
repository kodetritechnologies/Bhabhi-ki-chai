import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { PushSubscription } from '@/models/PushSubscription';
import { sendPushToUsers } from '@/lib/webPush';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { userEmail, subscription, userAgent = '', sendTest = false } = body;

    const cleanEmail = String(userEmail || '').trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: 'Login zaroori hai' }, { status: 401 });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User nahi mila' }, { status: 404 });
    }

    if (subscription?.endpoint && subscription?.keys?.p256dh && subscription?.keys?.auth) {
      await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
          userId: user._id,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
          userAgent,
        },
        { upsert: true, new: true }
      );
    }

    if (sendTest) {
      const result = await sendPushToUsers([user._id.toString()], {
        title: '☕ Bhabhi Ki Chai Alerts Active!',
        body: `Namaste ${user.name}! Ab aapko group ke set Chai Time par Chrome notification milega.`,
        url: '/',
        tag: 'test-chai-push',
      });
      return NextResponse.json({
        success: true,
        message: 'Test Chrome notification bhej diya gaya!',
        ...result,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Chrome notifications successfully enable ho gaye!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Push subscribe error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { endpoint } = body;
    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint });
    }
    return NextResponse.json({ success: true, message: 'Chrome notifications disabled' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
