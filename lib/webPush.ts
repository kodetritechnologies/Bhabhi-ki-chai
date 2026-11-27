import { setVapidDetails, sendNotification } from 'web-push';
import { PushSubscription } from '@/models/PushSubscription';

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@bhabhikichai.com';

  if (!publicKey || !privateKey) {
    return false;
  }

  setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Sends a Chrome Web Push notification to all subscribed devices for the given userIds.
 * Automatically cleans up expired/unsubscribed endpoints (HTTP 404/410).
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!ensureVapidConfigured() || userIds.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await PushSubscription.find({ userId: { $in: userIds } }).lean();
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    })
  );

  return { sent, failed };
}
