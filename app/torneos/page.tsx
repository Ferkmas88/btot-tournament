import type { Metadata } from 'next';
import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Torneos · Papaque',
  description: 'Listado de torneos de Dota 2 (y más) organizados en LATAM.',
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = { searchParams: Promise<{ game?: string; status?: string }> };

type TournamentCard = {
  slug: string;
  name: string;
  game: string;
  format: string;
  status: 'open' | 'live' | 'closed';
  max_teams: number;
  entry_fee_per_team_usd: number;
  prize_pool_usd: number;
  starts_at: string | null;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  open: { label: 'Abierto', cls: 'border-emerald-400/50 text-emerald-300 bg-emerald-400/10' },
  live: { label: 'En vivo', cls: 'border-blood/60 text-blood-light bg-blood/15' },
  closed: { label: 'Cerrado', cls: 'border-amber-gold/50 text-amber-gold bg-amber-gold/10' },
};

export default async function TorneosListingPage({ searchParams }: Props) {
  const { game, status } = await searchParams;

  const supabase = getServiceClient();
  let query = supabase
    .from('tournaments')
    .select(
      'slug, name, game, format, status, max_teams, entry_fee_per_team_usd, prize_pool_usd, starts_at',
    )
    .in('status', status ? [status] : ['open', 'live', 'closed'])
    .order('starts_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (game) query = query.eq('game', game);

  const { data } = await query;
  const tournaments = (data ?? []) as TournamentCard[];

  // Para counts por torneo (no critical — solo display).
  const ids = tournaments.map((t) => t.slug);
  const counts = await loadTeamCounts(ids);

  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1 mb-6"
        >
          ← Volver al sitio
        </Link>

        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-gold/80 mb-2">
            COMUNIDAD · TORNEOS
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-white">
            Torneos <span className="text-amber-gold">activos</span>
          </h1>
          <p className="text-white/60 text-sm mt-3 max-w-md">
            Listado de torneos LATAM organizados por miembros de la comunidad. Inscribite en el
            que te quede.
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip label="Todos" href="/torneos" active={!game && !status} />
          <FilterChip label="Dota 2" href="/torneos?game=dota2" active={game === 'dota2'} />
          <FilterChip label="CS2" href="/torneos?game=cs2" active={game === 'cs2'} />
          <FilterChip label="Valorant" href="/torneos?game=valorant" active={game === 'valorant'} />
          <FilterChip label="Solo abiertos" href="/torneos?status=open" active={status === 'open'} />
        </div>

        {tournaments.length === 0 ? (
          <div className="border border-white/10 bg-black/30 p-10 text-center">
            <p className="text-white/55 text-sm">Por ahora no hay torneos activos en este filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map((t) => {
              const badge = STATUS_LABEL[t.status] ?? STATUS_LABEL.closed;
              const count = counts.get(t.slug) ?? 0;
              return (
                <Link
                  key={t.slug}
                  href={`/torneos/${t.slug}`}
                  className="border border-white/10 hover:border-amber-gold/40 bg-black/35 p-5 transition group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.18em] border px-2 py-0.5 ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                      {t.format.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-white group-hover:text-amber-gold transition">
                    {t.name}
                  </h3>
                  <div className="font-mono text-[11px] text-white/55 mt-3 grid grid-cols-2 gap-y-1">
                    <span>Juego: <span className="text-white/85">{t.game}</span></span>
                    <span>Equipos: <span className="text-white/85">{count}/{t.max_teams}</span></span>
                    <span>
                      Entry:{' '}
                      <span className="text-white/85">
                        {Number(t.entry_fee_per_team_usd) > 0
                          ? `USD ${Number(t.entry_fee_per_team_usd).toFixed(0)}`
                          : 'Gratis'}
                      </span>
                    </span>
                    <span>
                      Pool:{' '}
                      <span className="text-white/85">
                        USD {Number(t.prize_pool_usd).toFixed(0)}
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center text-white/55 text-sm">
          ¿Sos organizador?{' '}
          <Link href="/organizer/signup" className="text-amber-gold hover:underline">
            Crear cuenta y publicar tu torneo →
          </Link>
        </div>
      </div>
    </main>
  );
}

async function loadTeamCounts(slugs: string[]): Promise<Map<string, number>> {
  if (!slugs.length) return new Map();
  const supabase = getServiceClient();
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, slug')
    .in('slug', slugs);
  const slugById = new Map((tournaments ?? []).map((t) => [t.id as string, t.slug as string]));
  const { data: teams } = await supabase
    .from('teams')
    .select('tournament_id, payment_status')
    .in('tournament_id', Array.from(slugById.keys()))
    .in('payment_status', ['paid', 'free']);
  const counts = new Map<string, number>();
  for (const t of teams ?? []) {
    const slug = slugById.get(t.tournament_id as string);
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return counts;
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`font-mono text-[10px] uppercase tracking-[0.18em] border px-3 py-1.5 ${
        active
          ? 'border-amber-gold bg-amber-gold/15 text-amber-gold'
          : 'border-white/15 text-white/55 hover:border-white/30'
      }`}
    >
      {label}
    </Link>
  );
}
