'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { RRMatch, TeamLite, Standing } from '@/lib/round-robin';

type Props = {
  teams: TeamLite[];
  matches: RRMatch[];
  standings: Standing[];
};

export default function RoundRobinAdmin({ teams, matches, standings }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const teamById = new Map(teams.map((t) => [t.id, t]));

  async function call(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch('/api/admin/round-robin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Error');
      throw new Error(data.error);
    }
    return data;
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function generate() {
    if (matches.length > 0 && !confirm('Ya hay matches. ¿Generar de nuevo? Solo agrega faltantes.')) return;
    try {
      await call({ action: 'generate' });
      refresh();
    } catch {}
  }

  async function reset() {
    if (!confirm('¿Borrar TODOS los matches? Esto resetea el bracket entero.')) return;
    try {
      await call({ action: 'reset' });
      refresh();
    } catch {}
  }

  async function setScore(match_id: string, score_a: number, score_b: number) {
    try {
      await call({ action: 'set_score', match_id, score_a, score_b });
      refresh();
    } catch {}
  }

  async function reopen(match_id: string) {
    try {
      await call({ action: 'set_status', match_id, status: 'pending' });
      refresh();
    } catch {}
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <a href="/round-robin" target="_blank" rel="noopener" className="btn-secondary text-xs">
          Ver standings público ↗
        </a>
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="btn-primary text-xs"
        >
          {matches.length === 0 ? 'Generar matches' : 'Regenerar (faltantes)'}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="font-mono text-[11px] tracking-[0.18em] uppercase border border-blood/40 text-blood-light px-4 py-2 hover:bg-blood/10 disabled:opacity-50"
        >
          Reset bracket
        </button>
      </div>

      <section>
        <h2 className="font-display text-2xl text-amber-gold mb-3">Standings</h2>
        {standings.length === 0 ? (
          <p className="font-mono text-xs text-white/40">Sin equipos</p>
        ) : (
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/40 border-b border-white/10">
                <tr className="text-left">
                  <Th>#</Th>
                  <Th>Equipo</Th>
                  <Th>PJ</Th>
                  <Th>V</Th>
                  <Th>D</Th>
                  <Th>GW</Th>
                  <Th>GL</Th>
                  <Th>GD</Th>
                  <Th>PTS</Th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.team.id} className="border-b border-white/5 hover:bg-white/5">
                    <Td className="font-mono text-amber-gold">{i + 1}</Td>
                    <Td>
                      <div className="font-display text-base">{s.team.team_name}</div>
                      <div className="font-mono text-[10px] text-white/40">{s.team.province}</div>
                    </Td>
                    <Td>{s.pj}</Td>
                    <Td className="text-emerald-400 font-mono">{s.v}</Td>
                    <Td className="text-blood-light font-mono">{s.d}</Td>
                    <Td>{s.gw}</Td>
                    <Td>{s.gl}</Td>
                    <Td className={s.gd > 0 ? 'text-emerald-400' : s.gd < 0 ? 'text-blood-light' : ''}>
                      {s.gd > 0 ? '+' : ''}{s.gd}
                    </Td>
                    <Td className="font-display text-lg text-amber-gold">{s.pts}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl text-amber-gold mb-3">
          Matches ({matches.filter((m) => m.status === 'done').length}/{matches.length})
        </h2>
        {matches.length === 0 ? (
          <p className="font-mono text-xs text-white/40">
            Sin matches. Click "Generar matches" arriba para crear todos vs todos.
          </p>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                teamA={teamById.get(m.team_a_id)}
                teamB={teamById.get(m.team_b_id)}
                onScore={setScore}
                onReopen={reopen}
                disabled={pending}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MatchRow({
  match,
  teamA,
  teamB,
  onScore,
  onReopen,
  disabled,
}: {
  match: RRMatch;
  teamA: TeamLite | undefined;
  teamB: TeamLite | undefined;
  onScore: (id: string, a: number, b: number) => void;
  onReopen: (id: string) => void;
  disabled: boolean;
}) {
  const done = match.status === 'done';
  const live = match.status === 'in_progress';
  const showScore = done || live;
  const borderCls = done
    ? 'border-emerald-400/30 bg-emerald-400/5'
    : live
      ? 'border-blood/40 bg-blood/5'
      : 'border-white/10 bg-ink-900/40';
  return (
    <div className={`border p-3 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-3 items-center ${borderCls}`}>
      <div className={`text-right ${done && match.winner_id === match.team_a_id ? 'text-amber-gold font-bold' : 'text-white/85'}`}>
        <span className="font-display text-base">{teamA?.team_name ?? '???'}</span>
      </div>
      <div className="font-mono text-sm text-amber-gold text-center min-w-[60px] flex flex-col items-center gap-1">
        {showScore ? (
          <>
            <span>{match.score_a} - {match.score_b}</span>
            {live && (
              <span className="font-mono text-[8px] uppercase tracking-wider text-blood-light flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blood-light animate-pulse" />
                EN VIVO
              </span>
            )}
          </>
        ) : (
          'vs'
        )}
      </div>
      <div className={`${done && match.winner_id === match.team_b_id ? 'text-amber-gold font-bold' : 'text-white/85'}`}>
        <span className="font-display text-base">{teamB?.team_name ?? '???'}</span>
      </div>
      <div className="flex flex-wrap gap-1 justify-end">
        {done ? (
          <button
            type="button"
            onClick={() => onReopen(match.id)}
            disabled={disabled}
            className="font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white/60 px-2 py-1 hover:border-white/40 disabled:opacity-40"
          >
            Editar
          </button>
        ) : (
          <>
            {/* EN VIVO (intermedio, sin ganador) */}
            <ScoreBtn label="1-0" onClick={() => onScore(match.id, 1, 0)} disabled={disabled} live />
            <ScoreBtn label="0-1" onClick={() => onScore(match.id, 0, 1)} disabled={disabled} live />
            <ScoreBtn label="1-1" onClick={() => onScore(match.id, 1, 1)} disabled={disabled} live />
            {/* FINAL (declara ganador) */}
            <ScoreBtn label="2-0 A" onClick={() => onScore(match.id, 2, 0)} disabled={disabled} />
            <ScoreBtn label="2-1 A" onClick={() => onScore(match.id, 2, 1)} disabled={disabled} />
            <ScoreBtn label="1-2 B" onClick={() => onScore(match.id, 1, 2)} disabled={disabled} />
            <ScoreBtn label="0-2 B" onClick={() => onScore(match.id, 0, 2)} disabled={disabled} />
          </>
        )}
      </div>
    </div>
  );
}

function ScoreBtn({
  label,
  onClick,
  disabled,
  live = false,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  live?: boolean;
}) {
  const cls = live
    ? 'font-mono text-[10px] uppercase tracking-wider border border-emerald-400/40 text-emerald-400 px-2 py-1 hover:bg-emerald-400/10 disabled:opacity-40'
    : 'font-mono text-[10px] uppercase tracking-wider border border-amber-gold/40 text-amber-gold px-2 py-1 hover:bg-amber-gold/10 disabled:opacity-40';
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {label}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-mono text-[10px] tracking-[0.2em] text-amber-gold/80 uppercase px-3 py-2">{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-middle text-white/85 ${className}`}>{children}</td>;
}
