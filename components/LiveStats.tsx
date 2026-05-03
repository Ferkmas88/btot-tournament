import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MAX_TEAMS = Number.parseInt(process.env.NEXT_PUBLIC_MAX_TEAMS ?? '6', 10);

type TeamRow = {
  id: string;
  team_name: string;
  province: string;
  created_at: string;
  join_code: string | null;
  captain_name: string;
};

type MemberRow = { team_id: string; slot: number; nick: string };

type TeamView = TeamRow & {
  confirmed_count: number;
  member_nicks: string[];
};

async function loadStats(): Promise<{
  teams: TeamView[];
  total: number;
  provinces: number;
  totalPlayers: number;
}> {
  try {
    const supabase = getServiceClient();
    const [teamsRes, membersRes] = await Promise.all([
      supabase
        .from('teams')
        .select('id, team_name, province, created_at, join_code, captain_name')
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false }),
      supabase.from('team_members').select('team_id, slot, nick'),
    ]);

    const rawTeams = (teamsRes.data ?? []) as TeamRow[];
    const members = (membersRes.data ?? []) as MemberRow[];

    const byTeam = new Map<string, MemberRow[]>();
    members.forEach((m) => {
      const arr = byTeam.get(m.team_id) ?? [];
      arr.push(m);
      byTeam.set(m.team_id, arr);
    });

    const teams: TeamView[] = rawTeams.map((t) => {
      const ms = (byTeam.get(t.id) ?? []).sort((a, b) => a.slot - b.slot);
      return {
        ...t,
        confirmed_count: ms.length,
        member_nicks: ms.map((m) => m.nick),
      };
    });

    const provinces = new Set(teams.map((t) => t.province)).size;
    const totalPlayers = teams.reduce((acc, t) => acc + 1 + t.confirmed_count, 0);
    return { teams, total: teams.length, provinces, totalPlayers };
  } catch {
    return { teams: [], total: 0, provinces: 0, totalPlayers: 0 };
  }
}

function TeamCard({ team }: { team: TeamView }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-xl text-white truncate flex-1">{team.team_name}</div>
        <span
          className={`font-mono text-[10px] tracking-wider px-1.5 py-0.5 border ${
            team.confirmed_count === 4
              ? 'border-emerald-400/50 text-emerald-400'
              : 'border-amber-gold/40 text-amber-gold'
          }`}
        >
          {team.confirmed_count}/4
        </span>
      </div>

      <ul className="font-mono text-[11px] text-white/65 space-y-0.5">
        <li className="truncate">
          <span className="text-amber-gold/70">★</span> {team.captain_name}
          <span className="text-white/30"> (cap)</span>
        </li>
        {team.member_nicks.map((nick, i) => (
          <li key={`m-${i}`} className="truncate">
            <span className="text-white/30">·</span> {nick}
          </li>
        ))}
        {Array.from({ length: 4 - team.confirmed_count }).map((_, i) => (
          <li key={`empty-${i}`} className="truncate text-white/25 italic">
            <span>·</span> esperando jugador
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10 mt-1">
        <span className="font-mono text-amber-gold/80 tracking-wider">{team.province}</span>
        <span className="font-mono text-white/35">{tiempoRelativo(team.created_at)}</span>
      </div>
    </>
  );

  if (!team.join_code) {
    return <div className="metal-tile p-4 flex flex-col gap-2">{inner}</div>;
  }

  return (
    <Link
      href={`/equipo/${team.join_code}`}
      className="metal-tile p-4 flex flex-col gap-2 transition hover:border-amber-gold/60 hover:bg-amber-gold/5 cursor-pointer"
    >
      {inner}
    </Link>
  );
}

function tiempoRelativo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export default async function LiveStats() {
  const { teams, total, provinces, totalPlayers } = await loadStats();
  const cupoPct = Math.min(100, (total / MAX_TEAMS) * 100);
  const visibles = teams.slice(0, 12);

  return (
    <section id="inscritos" className="relative overflow-hidden px-4 py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-abyss/40 to-ink-950" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="stamp-heading mb-4 border-amber-gold text-amber-gold">
            Lobby en vivo
          </div>
          <h2 className="font-display text-4xl md:text-6xl text-white mb-3">
            Equipos <span className="text-amber-gold">inscritos</span>
          </h2>
          <p className="font-mono text-xs text-white/50 tracking-[0.18em]">
            ACTUALIZADO AUTOMÁTICAMENTE
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="angled-panel p-5 md:p-7 min-h-[360px]">
            <div className="flex items-center justify-between mb-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                {visibles.length === 0
                  ? 'Sin equipos todavía'
                  : `Mostrando ${visibles.length} de ${total}`}
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-gold">
                <span className="h-2 w-2 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
                Live
              </div>
            </div>

            {visibles.length === 0 ? (
              <div className="border border-white/10 p-10 text-center">
                <p className="text-white/60 mb-4">
                  Sé el primer equipo del torneo. Cuando alguien se inscribe aparece acá.
                </p>
                <Link href="/inscribirse" className="btn-primary">
                  Inscribir el primero →
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {visibles.map((t) => (
                  <TeamCard key={t.id} team={t} />
                ))}
              </div>
            )}

            {teams.length > visibles.length && (
              <p className="font-mono text-[11px] text-white/40 text-center mt-5">
                + {teams.length - visibles.length} equipos más
              </p>
            )}
          </div>

          <aside className="space-y-4">
            <div className="metal-tile blue-glow p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-gold/80 mb-1">
                Cupo
              </div>
              <div className="font-display text-5xl text-white leading-none">
                {total}
                <span className="text-white/30 text-3xl"> / {MAX_TEAMS}</span>
              </div>
              <div className="mt-3 h-1.5 bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-amber-gold transition-all duration-700"
                  style={{ width: `${cupoPct}%` }}
                />
              </div>
              <div className="font-mono text-[10px] text-white/45 tracking-wider mt-2">
                {total >= MAX_TEAMS
                  ? 'Cupo lleno — lista de espera'
                  : `${MAX_TEAMS - total} cupos disponibles`}
              </div>
            </div>

            <div className="metal-tile p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-gold/80 mb-1">
                Provincias
              </div>
              <div className="font-display text-4xl text-white leading-none">{provinces}</div>
              <div className="font-mono text-[10px] text-white/45 tracking-wider mt-2">
                representadas
              </div>
            </div>

            <div className="metal-tile p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-gold/80 mb-1">
                Jugadores
              </div>
              <div className="font-display text-4xl text-white leading-none">{totalPlayers}</div>
              <div className="font-mono text-[10px] text-white/45 tracking-wider mt-2">
                en el torneo
              </div>
            </div>

            <Link
              href="/inscribirse"
              className="btn-primary w-full text-center justify-center"
            >
              Sumar mi equipo →
            </Link>

            <Link
              href="/round-robin"
              className="btn-secondary w-full text-center justify-center"
            >
              Ver standings →
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
