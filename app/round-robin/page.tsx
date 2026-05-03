import type { Metadata } from 'next';
import Link from 'next/link';
import { loadRoundRobin, type RRMatch, type Standing, type TeamLite } from '@/lib/round-robin';

export const metadata: Metadata = {
  title: 'Standings · Papaque',
  description: 'Standings y matches del torneo Papaque, formato todos contra todos BO3.',
};
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function RoundRobinPublicPage() {
  let teams: TeamLite[] = [];
  let matches: RRMatch[] = [];
  let standings: Standing[] = [];
  let error: string | null = null;
  try {
    const data = await loadRoundRobin();
    teams = data.teams;
    matches = data.matches;
    standings = data.standings;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error cargando torneo';
  }

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const champion = standings[0]?.pj > 0 && standings[0].v > 0 ? standings[0] : null;
  const allDone = matches.length > 0 && matches.every((m) => m.status === 'done');

  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1 mb-8"
        >
          ← Volver al sitio
        </Link>

        <header className="text-center mb-10">
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-gold/80 mb-2">
            PAPAQUE · BRACKET EN VIVO
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white mb-3">
            Standings <span className="text-amber-gold">en vivo</span>
          </h1>
          <p className="font-mono text-xs text-white/50 tracking-[0.18em]">
            {teams.length} EQUIPOS · TODOS CONTRA TODOS · BO3 · {matches.length} PARTIDOS
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
            {error}
          </div>
        )}

        {standings.length === 0 ? (
          <p className="font-mono text-xs text-white/40 text-center py-12">
            Sin equipos inscritos todavía.
          </p>
        ) : (
          <>
            {champion && allDone && (
              <div className="mb-10 angled-panel p-8 text-center max-w-xl mx-auto">
                <div className="stamp-heading mb-4 border-amber-gold text-amber-gold">Campeón</div>
                <div className="text-5xl mb-2">🏆</div>
                <h2 className="font-display text-4xl md:text-5xl shine-text mb-2">
                  {champion.team.team_name}
                </h2>
                <p className="font-mono text-sm text-white/50">{champion.team.province}</p>
                <p className="font-mono text-xs text-amber-gold mt-3">
                  {champion.pts} pts · {champion.v}V {champion.d}D · GD {champion.gd > 0 ? '+' : ''}{champion.gd}
                </p>
              </div>
            )}

            <section className="mb-12">
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
                      <tr
                        key={s.team.id}
                        className={`border-b border-white/5 ${i === 0 ? 'bg-amber-gold/5' : ''}`}
                      >
                        <Td className={`font-mono ${i === 0 ? 'text-amber-gold' : 'text-white/60'}`}>
                          {i + 1}
                        </Td>
                        <Td>
                          <div className="font-display text-base text-white">{s.team.team_name}</div>
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
            </section>

            <section>
              <h2 className="font-display text-2xl text-white mb-4">
                Matches ({matches.filter((m) => m.status === 'done').length}/{matches.length})
              </h2>
              {matches.length === 0 ? (
                <p className="font-mono text-xs text-white/40">Esperando que se generen los matches...</p>
              ) : (
                <div className="space-y-2">
                  {matches.map((m) => {
                    const a = teamById.get(m.team_a_id);
                    const b = teamById.get(m.team_b_id);
                    const done = m.status === 'done';
                    return (
                      <div
                        key={m.id}
                        className={`border p-3 grid grid-cols-[1fr_auto_1fr] gap-3 items-center ${done ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-white/10 bg-ink-900/40'}`}
                      >
                        <div className={`text-right ${done && m.winner_id === m.team_a_id ? 'text-amber-gold font-bold' : 'text-white/85'}`}>
                          <span className="font-display text-base">{a?.team_name ?? '???'}</span>
                        </div>
                        <div className="font-mono text-sm text-amber-gold text-center min-w-[60px]">
                          {done ? `${m.score_a} - ${m.score_b}` : 'vs'}
                        </div>
                        <div className={`${done && m.winner_id === m.team_b_id ? 'text-amber-gold font-bold' : 'text-white/85'}`}>
                          <span className="font-display text-base">{b?.team_name ?? '???'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-mono text-[10px] tracking-[0.2em] text-amber-gold/80 uppercase px-3 py-2">{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle text-white/85 ${className}`}>{children}</td>;
}
