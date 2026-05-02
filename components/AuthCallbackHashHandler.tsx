'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Props = { next: string };

export default function AuthCallbackHashHandler({ next }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const errorDesc = params.get('error_description');

        if (errorDesc) {
          setStatus('error');
          setErrorMsg(decodeURIComponent(errorDesc));
          return;
        }

        if (!accessToken || !refreshToken) {
          // Sin tokens en hash: probablemente vino sin auth válida.
          router.replace('/auth/login?error=callback_no_token');
          return;
        }

        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setStatus('error');
          setErrorMsg(error.message);
          return;
        }

        // Limpia hash y va al destino.
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        router.replace(next);
        router.refresh();
      } catch (e) {
        setStatus('error');
        setErrorMsg(e instanceof Error ? e.message : 'Error desconocido');
      }
    }
    run();
  }, [next, router]);

  return (
    <div className="text-center font-mono text-sm text-white/70 py-12">
      {status === 'processing' ? (
        <>Procesando login...</>
      ) : (
        <div>
          <p className="text-blood-light mb-4">Error: {errorMsg}</p>
          <a href="/auth/login" className="text-amber-gold hover:underline">
            ← Volver a entrar
          </a>
        </div>
      )}
    </div>
  );
}
