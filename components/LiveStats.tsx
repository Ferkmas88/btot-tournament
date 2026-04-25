import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MAX_TEAMS = 16;

type TeamRow = {
  team_name: string;
  province: string;
  created_at: string;
};

async function loadStats(): Promise<{ teams: TeamRow[]; total: number; provinces: number }> {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from('teams')
      .select('team_name, province, created_at')
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false });

    const teams = (data ?? []) as TeamRow[];
    const provinces = new Set(teams.map((t) => t.province)).size;
    return { teams, total: teams.length, provinces };
  } catch {
    return { teams: [], total: 0, provinces: 0 };
  }
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
  const { teams, total, provinces } = await loadStats();
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
                  <div
                    key={`${t.team_name}-${t.created_at}`}
                    className="metal-tile p-4 flex flex-col gap-1"
                  >
                    <div className="font-display text-xl text-white truncate">{t.team_name}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-amber-gold/80 tracking-wider">
                        {t.province}
                      </span>
                      <span className="font-mono text-white/35">
                        {tiempoRelativo(t.created_at)}
                      </span>
                    </div>
                  </div>
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
              <div className="font-display text-4xl text-white leading-none">{total * 5}</div>
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
          </aside>
        </div>
      </div>
    </section>
  );
}
