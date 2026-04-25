'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { MatchView, Slot, TeamLite } from '@/lib/bracket';

type Props = {
  matches: Record<Slot, MatchView>;
  teams: TeamLite[];
};

export default function BracketAdmin({ matches: initial, teams }: Props) {
  const router = useRouter();
  const [matches, setMatches] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function call(body: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch('/api/admin/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      throw e;
    }
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function setTeams(slot: Slot, team_a_id: string | null, team_b_id: string | null) {
    setMatches((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        team_a_id,
        team_b_id,
        team_a: teams.find((t) => t.id === team_a_id) ?? null,
        team_b: teams.find((t) => t.id === team_b_id) ?? null,
      },
    }));
    try {
      await call({ action: 'set_teams', slot, team_a_id, team_b_id });
      refresh();
    } catch {
      /* error already shown */
    }
  }

  async function setWinner(slot: Slot, winner_id: string | null) {
    try {
      await call({ action: 'set_winner', slot, winner_id });
      refresh();
    } catch {
      /* error already shown */
    }
  }

  async function setStatus(slot: Slot, status: 'pending' | 'in_progress' | 'done') {
    try {
      await call({ action: 'set_status', slot, status });
      refresh();
    } catch {
      /* error already shown */
    }
  }

  async function reset() {
    if (!confirm('¿Resetear todo el bracket? Esto borra equipos y ganadores.')) return;
    try {
      await call({ action: 'reset' });
      refresh();
    } catch {
      /* error already shown */
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <a href="/bracket" target="_blank" rel="noopener" className="btn-secondary text-xs">
          Ver bracket público ↗
        </a>
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="font-mono text-[11px] tracking-[0.18em] uppercase border border-blood/40 text-blood-light px-4 py-2 hover:bg-blood/10 disabled:opacity-50"
        >
          Resetear bracket
        </button>
      </div>

      <SemiCard
        slot="semi1"
        label="Semifinal 1"
        match={matches.semi1}
        teams={teams}
        onSetTeams={setTeams}
        onSetWinner={setWinner}
        onSetStatus={setStatus}
      />

      <SemiCard
        slot="semi2"
        label="Semifinal 2"
        match={matches.semi2}
        teams={teams}
        onSetTeams={setTeams}
        onSetWinner={setWinner}
        onSetStatus={setStatus}
      />

      <FinalCard
        match={matches.final}
        onSetWinner={(id) => setWinner('final', id)}
        onSetStatus={(s) => setStatus('final', s)}
      />
    </div>
  );
}

function SemiCard({
  slot,
  label,
  match,
  teams,
  onSetTeams,
  onSetWinner,
  onSetStatus,
}: {
  slot: 'semi1' | 'semi2';
  label: string;
  match: MatchView;
  teams: TeamLite[];
  onSetTeams: (slot: Slot, a: string | null, b: string | null) => void;
  onSetWinner: (slot: Slot, id: string | null) => void;
  onSetStatus: (slot: Slot, s: 'pending' | 'in_progress' | 'done') => void;
}) {
  const teamA = match.team_a_id ?? '';
  const teamB = match.team_b_id ?? '';

  return (
    <div className="border border-white/10 bg-ink-900/40 p-5">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-display text-2xl text-white">{label}</h3>
        <select
          value={match.status}
          onChange={(e) => onSetStatus(slot, e.target.value as 'pending' | 'in_progress' | 'done')}
          className="input-field max-w-[160px] text-sm"
        >
          <option value="pending">Pendiente</option>
          <option value="in_progress">En vivo</option>
          <option value="done">Cerrado</option>
        </select>
      </header>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <TeamSlot
          label="Equipo A"
          value={teamA}
          teams={teams}
          excludeId={teamB || null}
          onChange={(id) => onSetTeams(slot, id || null, teamB || null)}
        />
        <TeamSlot
          label="Equipo B"
          value={teamB}
          teams={teams}
          excludeId={teamA || null}
          onChange={(id) => onSetTeams(slot, teamA || null, id || null)}
        />
      </div>

      <div className="border-t border-white/10 pt-4">
        <label className="label-text">Ganador</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <button
            type="button"
            disabled={!match.team_a_id}
            onClick={() => onSetWinner(slot, match.team_a_id)}
            className={btnCls(match.winner_id === match.team_a_id)}
          >
            {match.team_a?.team_name || 'Equipo A'}
          </button>
          <button
            type="button"
            disabled={!match.team_b_id}
            onClick={() => onSetWinner(slot, match.team_b_id)}
            className={btnCls(match.winner_id === match.team_b_id)}
          >
            {match.team_b?.team_name || 'Equipo B'}
          </button>
          <button
            type="button"
            onClick={() => onSetWinner(slot, null)}
            className={btnCls(false) + ' opacity-70'}
          >
            ⨯ Limpiar
          </button>
        </div>
        {match.winner && (
          <p className="font-mono text-[11px] text-emerald-400 mt-3">
            ✓ {match.winner.team_name} pasa a la final
          </p>
        )}
      </div>
    </div>
  );
}

function FinalCard({
  match,
  onSetWinner,
  onSetStatus,
}: {
  match: MatchView;
  onSetWinner: (id: string | null) => void;
  onSetStatus: (s: 'pending' | 'in_progress' | 'done') => void;
}) {
  return (
    <div className="border border-amber-gold/40 bg-ink-900/40 p-5">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-display text-2xl text-amber-gold">Final</h3>
        <select
          value={match.status}
          onChange={(e) => onSetStatus(e.target.value as 'pending' | 'in_progress' | 'done')}
          className="input-field max-w-[160px] text-sm"
        >
          <option value="pending">Pendiente</option>
          <option value="in_progress">En vivo</option>
          <option value="done">Cerrado</option>
        </select>
      </header>

      <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
        <ReadOnlyTeam label="Ganador Semi 1" team={match.team_a} />
        <ReadOnlyTeam label="Ganador Semi 2" team={match.team_b} />
      </div>

      <div className="border-t border-white/10 pt-4">
        <label className="label-text">Campeón</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <button
            type="button"
            disabled={!match.team_a_id}
            onClick={() => onSetWinner(match.team_a_id)}
            className={btnCls(match.winner_id === match.team_a_id)}
          >
            {match.team_a?.team_name || 'Esperando…'}
          </button>
          <button
            type="button"
            disabled={!match.team_b_id}
            onClick={() => onSetWinner(match.team_b_id)}
            className={btnCls(match.winner_id === match.team_b_id)}
          >
            {match.team_b?.team_name || 'Esperando…'}
          </button>
          <button
            type="button"
            onClick={() => onSetWinner(null)}
            className={btnCls(false) + ' opacity-70'}
          >
            ⨯ Limpiar
          </button>
        </div>
        {match.winner && (
          <p className="font-mono text-[11px] text-amber-gold mt-3">
            🏆 {match.winner.team_name} es el campeón
          </p>
        )}
      </div>
    </div>
  );
}

function TeamSlot({
  label,
  value,
  teams,
  excludeId,
  onChange,
}: {
  label: string;
  value: string;
  teams: TeamLite[];
  excludeId: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <label className="label-text">{label}</label>
      <select
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Sin equipo —</option>
        {teams
          .filter((t) => t.id !== excludeId)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {t.team_name} · {t.province}
            </option>
          ))}
      </select>
    </div>
  );
}

function ReadOnlyTeam({ label, team }: { label: string; team: TeamLite | null }) {
  return (
    <div className="border border-white/10 p-3 bg-black/20">
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/45 mb-1">
        {label}
      </div>
      <div className="text-white">{team ? team.team_name : 'Por definir'}</div>
    </div>
  );
}

function btnCls(active: boolean): string {
  return active
    ? 'font-mono text-xs uppercase tracking-wider bg-amber-gold/20 border border-amber-gold text-amber-gold py-2.5 px-3 truncate'
    : 'font-mono text-xs uppercase tracking-wider border border-white/15 bg-ink-900/40 text-white/80 py-2.5 px-3 hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed truncate';
}
