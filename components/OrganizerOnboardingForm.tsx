'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  initialDisplayName: string;
  initialWhatsapp: string;
  nextHref: string;
};

export default function OrganizerOnboardingForm({
  initialDisplayName,
  initialWhatsapp,
  nextHref,
}: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Si vienen ambos datos en la URL (flow del email confirm), crear el record
  // automáticamente y redirigir. Sin esto, el user vería una pantalla extra
  // post-email-confirm cuando ya nos dio los datos en signup.
  useEffect(() => {
    if (autoSubmitted) return;
    if (!initialDisplayName) return;
    setAutoSubmitted(true);
    void submit(initialDisplayName, initialWhatsapp, '', '', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(
    dn: string,
    wa: string,
    tg: string,
    dc: string,
    biography: string,
  ) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/organizer/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: dn.trim(),
          contact_whatsapp: wa.trim() || null,
          contact_telegram: tg.trim() || null,
          contact_discord: dc.trim() || null,
          bio: biography.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No pudimos guardar tu perfil');
      router.push(nextHref);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setSubmitting(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(displayName, whatsapp, telegram, discord, bio);
  }

  return (
    <form onSubmit={onSubmit} className="angled-panel p-6 md:p-8 space-y-5">
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
        <label className="label-text">WhatsApp</label>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+1 832 291 7750"
          className="input-field"
          maxLength={30}
        />
      </div>

      <div>
        <label className="label-text">Telegram (opcional)</label>
        <input
          type="text"
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
          placeholder="@usuario"
          className="input-field"
          maxLength={60}
        />
      </div>

      <div>
        <label className="label-text">Discord (opcional)</label>
        <input
          type="text"
          value={discord}
          onChange={(e) => setDiscord(e.target.value)}
          placeholder="link de servidor o usuario"
          className="input-field"
          maxLength={60}
        />
      </div>

      <div>
        <label className="label-text">Bio (opcional, máx 500)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Comunidad LATAM Dota 2 desde 2018..."
          className="input-field min-h-[80px]"
          maxLength={500}
        />
      </div>

      {error && (
        <div className="border border-blood bg-blood/10 text-blood-light text-sm font-mono p-3">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
        {submitting ? 'Guardando...' : 'Continuar al dashboard →'}
      </button>
    </form>
  );
}
