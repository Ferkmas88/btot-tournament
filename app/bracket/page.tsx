import type { Metadata } from 'next';
import Link from 'next/link';
import { loadBracket, type MatchView, type TeamLite } from '@/lib/bracket';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Bracket · Papaque',
  description: 'Bracket en vivo del torneo de Dota 2.',
};

export default async function BracketPage() {
  let bracket;
  let error: string | null = null;
  try {
    bracket = await loadBracket();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error cargando bracket';
  }

  const matches = bracket?.matches;
  const champion = matches?.final.winner ?? null;

  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1 mb-8"
        >
          ← Volver al sitio
        </Link>

        <header className="text-center mb-12">
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-gold/80 mb-2">
            PAPAQUE · BRACKET EN VIVO
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white mb-3">
            Camino al <span className="text-amber-gold">campeón</span>
          </h1>
          <p className="font-mono text-xs text-white/50 tracking-[0.18em]">
            4 EQUIPOS · ELIMINACIÓN DIRECTA · 3 PARTIDAS
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
            {error}
          </div>
        )}

        {matches && (
          <>
            <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-10 items-stretch">
              {/* Columna izquierda: semis */}
              <div className="space-y-8">
                <MatchCard label="Semifinal 1" match={matches.semi1} />
                <MatchCard label="Semifinal 2" match={matches.semi2} />
              </div>

              {/* Conector visual */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="font-mono text-[10px] tracking-[0.3em] text-amber-gold/50 transform -rotate-90 whitespace-nowrap">
                  → A LA FINAL →
                </div>
              </div>

              {/* Columna derecha: final */}
              <div className="flex items-center">
                <MatchCard label="Final" match={matches.final} highlight />
              </div>
            </div>

            {champion && (
              <div className="mt-14 angled-panel p-10 text-center max-w-xl mx-auto">
                <div className="stamp-heading mb-4 border-amber-gold text-amber-gold">Campeón</div>
                <div className="font-display text-5xl md:text-7xl text-white mb-2">
                  🏆
                </div>
                <h2 className="font-display text-4xl md:text-5xl shine-text mb-3">
                  {champion.team_name}
                </h2>
                <p className="font-mono text-sm text-white/50 tracking-wider">
                  {champion.province}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function MatchCard({
  label,
  match,
  highlight,
}: {
  label: string;
  match: MatchView;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? 'angled-panel blue-glow p-5' : 'angled-panel p-5'}>
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-amber-gold/80">
          {label}
        </div>
        <StatusPill status={match.status} />
      </div>

      <TeamRow
        team={match.team_a}
        isWinner={!!match.winner_id && match.winner_id === match.team_a_id}
        isLoser={
          match.status === 'done' &&
          !!match.winner_id &&
          match.winner_id !== match.team_a_id &&
          !!match.team_a_id
        }
      />
      <div className="my-2 font-mono text-[10px] tracking-[0.3em] text-white/30 text-center">
        VS
      </div>
      <TeamRow
        team={match.team_b}
        isWinner={!!match.winner_id && match.winner_id === match.team_b_id}
        isLoser={
          match.status === 'done' &&
          !!match.winner_id &&
          match.winner_id !== match.team_b_id &&
          !!match.team_b_id
        }
      />
    </div>
  );
}

function TeamRow({
  team,
  isWinner,
  isLoser,
}: {
  team: TeamLite | null;
  isWinner: boolean;
  isLoser: boolean;
}) {
  const cls = isWinner
    ? 'border-amber-gold bg-amber-gold/10'
    : isLoser
    ? 'border-white/10 bg-black/30 opacity-50'
    : 'border-white/15 bg-ink-900/40';

  return (
    <div className={`border ${cls} p-3 flex items-center justify-between gap-3 transition`}>
      <div className="min-w-0 flex-1">
        {team ? (
          <>
            <div
              className={`font-display text-lg truncate ${
                isWinner ? 'text-amber-gold' : 'text-white'
              }`}
            >
              {team.team_name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              {team.province}
            </div>
          </>
        ) : (
          <div className="font-mono text-sm text-white/30 italic">Por definir</div>
        )}
      </div>
      {isWinner && <span className="font-mono text-[10px] text-amber-gold">✓ GANA</span>}
    </div>
  );
}

function StatusPill({ status }: { status: 'pending' | 'in_progress' | 'done' }) {
  const map = {
    pending: { color: 'border-white/20 text-white/45', label: 'Pendiente' },
    in_progress: { color: 'border-amber-gold/60 text-amber-gold animate-pulse', label: 'En vivo' },
    done: { color: 'border-emerald-400/40 text-emerald-400', label: 'Cerrado' },
  };
  const { color, label } = map[status];
  return (
    <span className={`inline-block border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
}
