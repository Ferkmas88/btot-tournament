import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

// Handler para email confirmation y password recovery.
// Supabase manda al user a {origin}/auth/callback?code=xxx&next=/algo
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/perfil';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // Si fallo o no hay code: ir a login con mensaje.
  return NextResponse.redirect(new URL('/auth/login?error=callback', url.origin));
}
