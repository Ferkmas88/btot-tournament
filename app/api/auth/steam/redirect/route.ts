import { NextResponse } from 'next/server';
import { buildOpenIDLoginUrl, getAppOrigin } from '@/lib/steam';

export const runtime = 'nodejs';

// Permite anónimo (crea cuenta) o logueado (linkea Steam a cuenta existente).
// Lógica de quién es se decide en /api/auth/steam/callback.
export async function GET(request: Request) {
  const origin = getAppOrigin(request);
  return NextResponse.redirect(buildOpenIDLoginUrl(origin));
}
