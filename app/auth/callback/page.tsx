import { redirect } from 'next/navigation';
import AuthCallbackHashHandler from '@/components/AuthCallbackHashHandler';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = { searchParams: Promise<{ code?: string; next?: string; error?: string }> };

// Maneja dos flows:
// 1. PKCE: ?code=...&next=... -> exchangeCodeForSession server-side -> redirect.
// 2. Implicit: #access_token=...&refresh_token=... -> client-side setSession -> redirect.
export default async function AuthCallbackPage({ searchParams }: Props) {
  const { code, next: nextRaw } = await searchParams;
  const next = nextRaw && nextRaw.startsWith('/') ? nextRaw : '/perfil';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
    redirect('/auth/login?error=exchange_failed');
  }

  // Sin code: el access_token está en el hash (#). Lo agarra el client component.
  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-md mx-auto">
        <AuthCallbackHashHandler next={next} />
      </div>
    </main>
  );
}
