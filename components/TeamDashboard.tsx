'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type RosterSlot = { slot: number; confirmed: boolean; nick_final: string | null };

type TeamInfo = {
  team_name: string;
  captain_name: string;
  province: string;
};

type Props = {
  joinCode: string;
  team: TeamInfo;
  initialSlots: RosterSlot[];
};

export default function TeamDashboard({ joinCode, team, initialSlots }: Props) {
  const discord = process.env.NEXT_PUBLIC_DISCORD_INVITE ?? '#';
  const [slots, setSlots] = useState<RosterSlot[]>(initialSlots);
  const [lastSync, setLastSync] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/team/${joinCode}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !Array.isArray(json.slots)) return;
        setSlots(json.slots as RosterSlot[]);
        setLastSync(Date.now());
      } catch {
        /* ignore */
      }
    }

    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [joinCode]);

  const confirmedCount = slots.filter((s) => s.confirmed).length;
  const allIn = confirmedCount === 4;

  return (
    <div className="angled-panel mx-auto max-w-2xl p-8 md:p-10 text-center">
      <div className="stamp-heading mb-6 border-amber-gold text-amber-gold">
        {allIn ? 'Equipo completo' : 'Equipo creado'}
      </div>
      <h2 className="font-display text-3xl md:text-5xl text-white mb-2">{team.team_name}</h2>
      <p className="font-mono text-xs text-white/50 mb-6">
        {team.province} · Capitán: {team.captain_name}
      </p>

      {!allIn && (
        <p className="text-white/70 mb-8 max-w-lg mx-auto">
          Esperando que los 4 jugadores entren con su nombre + email. Sin esos 4 confirmados, el
          equipo no juega.
        </p>
      )}

      <div className="border border-white/15 bg-ink-900/60 p-6 text-left mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="label-text">Jugadores conectados</p>
          <span className="font-mono text-xs text-amber-gold">{confirmedCount}/4</span>
        </div>
        <ul className="space-y-2">
          {slots.map((s, i) => (
            <li
              key={s.slot}
              className={`flex items-center justify-between border px-3 py-2 font-mono text-sm ${
                s.confirmed
                  ? 'border-amber-gold/40 bg-amber-gold/5 text-white'
                  : 'border-white/10 bg-black/30 text-white/40'
              }`}
            >
              <span>
                <span className="text-white/40 mr-2">#{i + 1}</span>
                {s.confirmed ? s.nick_final : 'Esperando...'}
              </span>
              <span className={s.confirmed ? 'text-amber-gold' : 'text-white/30'}>
                {s.confirmed ? '✓' : '—'}
              </span>
            </li>
          ))}
        </ul>
        <p className="font-mono text-[10px] text-white/30 mt-4 text-center">
          Esta pantalla se actualiza sola cada 5s. Guardá el link como favorito para volver cuando
          quieras.
          {lastSync && ` Última sync: ${new Date(lastSync).toLocaleTimeString()}`}
        </p>
      </div>

      <p className="text-white/60 text-sm mb-5">
        También uníte vos al Discord — los anuncios del torneo viven ahí.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href={discord} target="_blank" rel="noopener" className="btn-primary">
          Unirme al Discord →
        </a>
        <Link href="/" className="btn-secondary">
          Volver al sitio
        </Link>
      </div>
    </div>
  );
}
