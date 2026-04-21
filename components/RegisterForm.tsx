'use client';

import { useState } from 'react';
import { PROVINCES } from '@/lib/supabase';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function RegisterForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const discord = process.env.NEXT_PUBLIC_DISCORD_INVITE ?? '#';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto text-center border-2 border-amber-gold p-10 bg-ink-900/80">
        <div className="stamp-heading mb-6 border-amber-gold text-amber-gold">Registrado</div>
        <h3 className="font-display text-4xl md:text-5xl text-white mb-4">
          Tu equipo está <span className="text-amber-gold">dentro</span>
        </h3>
        <p className="text-white/70 mb-8">
          Te confirmaremos por WhatsApp o Telegram 24 horas antes del torneo.
          <br />
          Mientras tanto, <strong className="text-white">únete al Discord AHORA</strong>. Los
          brackets y la mesa de capitanes se publican ahí.
        </p>
        <a href={discord} target="_blank" rel="noopener" className="btn-primary">
          Unirme al Discord →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl mx-auto bg-ink-900/60 border border-blood/30 p-6 md:p-10">
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Nombre del equipo" name="team_name" placeholder="Los Tigres del Cerro" required />
        <Field label="Capitán (nombre real)" name="captain_name" placeholder="Juan Pérez" required />
        <Field label="Capitán — Nick Steam" name="captain_steam" placeholder="juanpz_cba" required />

        <div>
          <label className="label-text">Contacto del capitán</label>
          <div className="flex gap-2">
            <select name="contact_type" className="input-field max-w-[150px]" defaultValue="whatsapp" required>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
            </select>
            <input
              name="captain_contact"
              placeholder="+53 55555555"
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="label-text">Provincia</label>
          <select name="province" className="input-field" required defaultValue="">
            <option value="" disabled>Selecciona...</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div />

        <Field label="Jugador 2 — Nick Steam" name="player_2" required />
        <Field label="Jugador 3 — Nick Steam" name="player_3" required />
        <Field label="Jugador 4 — Nick Steam" name="player_4" required />
        <Field label="Jugador 5 — Nick Steam" name="player_5" required />

        <div className="md:col-span-2">
          <label className="label-text">¿Dónde nos conociste? (opcional)</label>
          <select name="referral_source" className="input-field" defaultValue="">
            <option value="">—</option>
            <option value="whatsapp">WhatsApp de un amigo</option>
            <option value="telegram">Grupo de Telegram</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="youtuber">Un YouTuber/Streamer</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-3 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-4">
        <button type="submit" disabled={status === 'submitting'} className="btn-primary disabled:opacity-50">
          {status === 'submitting' ? 'Enviando...' : 'Inscribir equipo'}
        </button>
        <p className="font-mono text-xs text-white/40 text-center max-w-md">
          Al registrarte aceptas que te contactemos por WhatsApp/Telegram para coordinar el torneo
          y eventos futuros de la comunidad.
        </p>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
};

function Field({ label, name, placeholder, required }: FieldProps) {
  return (
    <div>
      <label className="label-text">{label}</label>
      <input name={name} placeholder={placeholder} required={required} className="input-field" />
    </div>
  );
}
