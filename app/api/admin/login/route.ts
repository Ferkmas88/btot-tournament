import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_COOKIE, COOKIE_OPTIONS, checkPassword, expectedToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const schema = z.object({
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password requerido' }, { status: 400 });
  }

  try {
    if (!checkPassword(parsed.data.password)) {
      return NextResponse.json({ error: 'Password incorrecto' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, expectedToken(), COOKIE_OPTIONS);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
