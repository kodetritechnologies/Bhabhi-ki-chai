import { setVapidDetails, sendNotification } from 'web-push';
import { PushSubscription } from '@/models/PushSubscription';

let vapidConfigured = false;

function normalizeVapidSubject(raw?: string): string {
  const cleaned = (raw || '').trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return 'mailto:admin@bhabhikichai.com';

  let candidate = cleaned;
  if (cleaned.includes('@') && !cleaned.startsWith('mailto:')) {
    candidate = `mailto:${cleaned}`;
  } else if (!/^https?:\/\//i.test(cleaned) && !cleaned.startsWith('mailto:')) {
    candidate = `https://${cleaned}`;
  }

  try {
    new URL(candidate);
    return candidate;
  } catch {
    return 'mailto:admin@bhabhikichai.com';
  }
}

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = normalizeVapidSubject(process.env.VAPID_SUBJECT);

  if (!publicKey || !privateKey) {
    return false;
  }

  try {
    setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    return true;
  } catch (err) {
    console.error('VAPID configuration error:', err);
    return false;
  }
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
