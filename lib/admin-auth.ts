import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

export const ADMIN_COOKIE = 'btot_admin';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function getAdminPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || pwd.length < 6) {
    throw new Error('ADMIN_PASSWORD no configurado (mínimo 6 chars)');
  }
  return pwd;
}

// Token derivado del password — la cookie no contiene el password en claro.
// Sin secret separado: usar el password como su propia key HMAC es suficiente
// para 1 admin / dashboard interno. Si el password rota, la cookie deja de servir.
export function buildToken(password: string): string {
  return createHmac('sha256', password).update('btot-admin-v1').digest('hex');
}

export function expectedToken(): string {
  return buildToken(getAdminPassword());
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function checkPassword(input: string): boolean {
  return safeEqual(input, getAdminPassword());
}

export async function isAuthed(): Promise<boolean> {
  try {
    const store = await cookies();
    const cookie = store.get(ADMIN_COOKIE);
    if (!cookie?.value) return false;
    return safeEqual(cookie.value, expectedToken());
  } catch {
    return false;
  }
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: COOKIE_MAX_AGE,
};
