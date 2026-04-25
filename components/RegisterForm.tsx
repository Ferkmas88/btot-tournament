'use client';

import { useState } from 'react';
import { PROVINCES } from '@/lib/supabase';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function RegisterForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
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
      setJoinCode(data.join_code ?? null);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  if (status === 'success') {
    return <SuccessPanel joinCode={joinCode} discord={discord} />;
  }

  return (
    <form onSubmit={onSubmit} className="angled-panel mx-auto max-w-3xl p-6 md:p-10">
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

function SuccessPanel({ joinCode, discord }: { joinCode: string | null; discord: string }) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const joinUrl = joinCode ? `${origin}/unirse/${joinCode}` : '';
  const waMessage = joinCode
    ? `Hermano, te metí en el equipo del torneo de Dota 2 cubano. Confirmá tu Steam acá: ${joinUrl}`
    : '';
  const waHref = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  async function copy(value: string, kind: 'link' | 'code') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard bloqueado, ignoro */
    }
  }

  return (
    <div className="angled-panel mx-auto max-w-2xl p-10 text-center">
      <div className="stamp-heading mb-6 border-amber-gold text-amber-gold">Registrado</div>
      <h3 className="font-display text-4xl md:text-5xl text-white mb-4">
        Tu equipo está <span className="text-amber-gold">dentro</span>
      </h3>

      {joinCode && (
        <div className="mb-8 border border-amber-gold/40 bg-ink-900/60 p-6 text-left">
          <p className="label-text mb-3 text-center">Código de tu equipo</p>
          <div className="flex justify-center mb-5">
            <button
              type="button"
              onClick={() => copy(joinCode, 'code')}
              className="font-mono text-3xl md:text-4xl tracking-[0.4em] text-amber-gold border-2 border-amber-gold/50 px-6 py-3 hover:bg-amber-gold/10 transition"
              title="Click para copiar"
            >
              {joinCode}
            </button>
          </div>

          <p className="text-white/70 text-sm mb-4 text-center">
            Mandale este link a tus 4 jugadores para que confirmen su Steam:
          </p>

          <div className="font-mono text-xs bg-black/50 border border-white/10 p-3 break-all text-white/80 mb-4">
            {joinUrl}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => copy(joinUrl, 'link')}
              className="btn-secondary text-sm"
            >
              {copied === 'link' ? '✓ Copiado' : 'Copiar link'}
            </button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener"
              className="btn-secondary text-sm"
            >
              Compartir por WhatsApp
            </a>
          </div>

          <p className="text-white/40 text-xs mt-4 font-mono text-center">
            Si tus jugadores no confirman, el equipo igual queda registrado con los nicks que pusiste.
          </p>
        </div>
      )}

      <p className="text-white/70 mb-6">
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
