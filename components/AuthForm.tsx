'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Mode = 'login' | 'signup';

type Props = {
  mode: Mode;
  next?: string;
};

export default function AuthForm({ mode, next = '/perfil' }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === 'signup') {
        const origin = window.location.origin;
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() || email.split('@')[0] },
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (err) throw err;
        setInfo(
          'Te mandamos un email para confirmar la cuenta. Revisalo (también spam) y volvé acá.',
        );
        setSubmitting(false);
        return;
      }

      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="angled-panel p-6 md:p-8 space-y-5">
      {mode === 'signup' && (
        <div>
          <label className="label-text">Tu nombre o nick (visible)</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ej: ferkmas"
            className="input-field"
            maxLength={40}
          />
        </div>
      )}

      <div>
        <label className="label-text">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@email.com"
          className="input-field"
        />
      </div>

      <div>
        <label className="label-text">Contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mínimo 6 caracteres"
          className="input-field"
        />
      </div>

      {error && (
        <div className="border border-blood bg-blood/10 text-blood-light text-sm font-mono p-3">
          {error}
        </div>
      )}

      {info && (
        <div className="border border-amber-gold/40 bg-amber-gold/10 text-amber-gold text-sm font-mono p-3">
          {info}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
        {submitting ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
      </button>

      <div className="text-center font-mono text-xs text-white/50 pt-2 border-t border-white/10">
        {mode === 'signup' ? (
          <>
            ¿Ya tenés cuenta?{' '}
            <Link
              href={`/auth/login?next=${encodeURIComponent(next)}`}
              className="text-amber-gold hover:underline"
            >
              Entrar
            </Link>
          </>
        ) : (
          <>
            ¿Sos nuevo?{' '}
            <Link
              href={`/auth/signup?next=${encodeURIComponent(next)}`}
              className="text-amber-gold hover:underline"
            >
              Crear cuenta
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
