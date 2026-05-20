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

export default function OrganizerAuthForm({ mode, next = '/dashboard' }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
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
        const trimmedName = displayName.trim();
        if (trimmedName.length < 2) {
          throw new Error('Tu nombre de organizador necesita al menos 2 caracteres.');
        }
        const origin = window.location.origin;
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: trimmedName },
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/organizer/onboarding?display_name=' + encodeURIComponent(trimmedName) + '&whatsapp=' + encodeURIComponent(whatsapp.trim()))}`,
          },
        });
        if (err) throw err;

        // Si Supabase auto-confirma (modo dev), session ya está activa →
        // creamos el organizer record inmediatamente. Sino, esperamos al
        // email confirm.
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) {
          await createOrganizerRecord(trimmedName, whatsapp.trim());
          router.push(next);
          router.refresh();
          return;
        }

        setInfo(
          'Te mandamos un email para confirmar la cuenta. Revisalo (también spam) y volvé.',
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
        <>
          <div>
            <label className="label-text">Nombre del organizador (público)</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ej: Pedritín · LATAM Esports"
              className="input-field"
              maxLength={80}
            />
          </div>

          <div>
            <label className="label-text">WhatsApp (opcional, jugadores te contactan acá)</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+1 832 291 7750"
              className="input-field"
              maxLength={30}
            />
          </div>
        </>
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
        {submitting ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta organizador' : 'Entrar'}
      </button>

      <div className="text-center font-mono text-xs text-white/50 pt-2 border-t border-white/10">
        {mode === 'signup' ? (
          <>
            ¿Ya tenés cuenta?{' '}
            <Link href="/organizer/login" className="text-amber-gold hover:underline">
              Entrar
            </Link>
          </>
        ) : (
          <>
            ¿Nuevo organizador?{' '}
            <Link href="/organizer/signup" className="text-amber-gold hover:underline">
              Crear cuenta
            </Link>
          </>
        )}
      </div>
    </form>
  );
}

async function createOrganizerRecord(displayName: string, whatsapp: string) {
  const res = await fetch('/api/organizer/upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      display_name: displayName,
      contact_whatsapp: whatsapp || null,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'No pudimos crear el perfil de organizador');
  }
}
