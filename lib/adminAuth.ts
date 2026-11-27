import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'bhabhi_admin_token';

function getSecret(): string {
  return process.env.JWT_SECRET || 'kodetrisecrect';
}

export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyAdminPassword(password: string, passwordHash: string): Promise<boolean> {
  if (!password || !passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}

export function signAdminToken(email: string, adminId?: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      adminId,
      role: 'admin',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token?: string | null): { email: string; adminId?: string } | null {
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
    return { email: parsed.email, adminId: parsed.adminId };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<{ email: string; adminId?: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}
