import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'bhabhi_admin_token';

function getSecret(): string {
  return process.env.JWT_SECRET || 'kodetrisecrect';
}

export function getAdminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL || 'admin@bhabhikichai.com').trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'admin123',
  };
}

export function signAdminToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      role: 'admin',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token?: string | null): { email: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed.role !== 'admin' || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return { email: parsed.email };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}
