'use client';

import { useState } from 'react';
import {
  isValidEmail,
  isValidName,
  VALIDATION_MESSAGES,
} from '@/lib/validators';

export type SlotInfo = {
  slot: number;
  nick_tentative: string;
  confirmed: boolean;
  nick_final: string | null;
};

export type TeamSummary = {
  team_name: string;
  captain_name: string;
  captain_steam: string;
  province: string;
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Props = {
  code: string;
  team: TeamSummary;
  slots: SlotInfo[];
};

export default function JoinForm({ code, team: _team, slots }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [confirmedNick, setConfirmedNick] = useState<string | null>(null);

  const [nick, setNick] = useState('');
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState({ nick: false, email: false });

  const discord = process.env.NEXT_PUBLIC_DISCORD_INVITE ?? '#';
  const cuposLibres = slots.filter((s) => !s.confirmed).length;
  const teamFull = cuposLibres === 0;

  const nickErr = !nick.trim() ? 'Campo obligatorio' : isValidName(nick) ? null : VALIDATION_MESSAGES.name;
  const emailErr = !email.trim() ? 'Campo obligatorio' : isValidEmail(email) ? null : VALIDATION_MESSAGES.email;
  const formValid = !nickErr && !emailErr;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ nick: true, email: true });
    if (!formValid) return;

    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch(`/api/team/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: nick.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No pudimos confirmar');

      setConfirmedNick(nick.trim());
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  if (status === 'success') {
    return (
      <div className="border-2 border-amber-gold p-8 bg-ink-900/80 text-center">
        <div className="stamp-heading mb-5 border-amber-gold text-amber-gold">Confirmado</div>
        <h2 className="font-display text-3xl md:text-4xl text-white mb-3">
          Listo, <span className="text-amber-gold">{confirmedNick}</span>
        </h2>
        <p className="text-white/70 mb-6">
          Estás dentro del equipo. Te mandamos los detalles del torneo a tu email.
          Sumate al Discord para los anuncios.
        </p>
        <a href={discord} target="_blank" rel="noopener" className="btn-primary">
          Unirme al Discord →
        </a>
      </div>
    );
  }

  if (teamFull) {
    return (
      <div className="border border-blood/50 p-8 bg-ink-900/60 text-center">
        <h2 className="font-display text-2xl text-white mb-3">Equipo completo</h2>
        <p className="text-white/70">
          Los 4 jugadores ya confirmaron. Si esto es un error, hablá con el capitán.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-ink-900/60 border border-blood/30 p-6 md:p-8 space-y-5">
      <div className="border border-amber-gold/30 bg-amber-gold/5 p-3 text-center">
        <p className="font-mono text-[11px] tracking-wider text-amber-gold">
          QUEDAN {cuposLibres} CUPOS · TE ASIGNAMOS EL PRIMER SLOT LIBRE
        </p>
      </div>

      <div>
        <label className="label-text">Tu nombre completo</label>
        <input
          name="nick"
          required
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, nick: true }))}
          placeholder="Pedro Gómez"
          className={`input-field ${touched.nick && nickErr ? 'border-blood/60' : ''}`}
          autoComplete="off"
          autoFocus
        />
        {touched.nick && nickErr && (
          <p className="font-mono text-[11px] text-blood-light mt-1.5">{nickErr}</p>
        )}
      </div>

      <div>
        <label className="label-text">Tu email</label>
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="pedro@email.com"
          className={`input-field ${touched.email && emailErr ? 'border-blood/60' : ''}`}
          autoComplete="off"
        />
        {touched.email && emailErr && (
          <p className="font-mono text-[11px] text-blood-light mt-1.5">{emailErr}</p>
        )}
      </div>

      {error && (
        <div className="p-3 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn-primary disabled:opacity-50"
        >
          {status === 'submitting' ? 'Confirmando...' : 'Unirme al equipo'}
        </button>
        <p className="font-mono text-[10px] text-white/40 text-center max-w-md">
          Te mandamos los detalles del torneo a tu email después.
        </p>
      </div>
    </form>
  );
}
