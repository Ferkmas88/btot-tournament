import { NextResponse } from 'next/server';
import { buildOpenIDLoginUrl, getAppOrigin } from '@/lib/steam';
import { getUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/auth/login?next=/perfil', url.origin));
  }
  const origin = getAppOrigin(request);
  return NextResponse.redirect(buildOpenIDLoginUrl(origin));
}
