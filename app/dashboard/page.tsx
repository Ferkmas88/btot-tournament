import Link from 'next/link';
import { aggregateStats, loadOrganizerTournaments, requireOrganizer } from '@/lib/organizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Borrador', cls: 'border-white/20 text-white/55 bg-white/5' },
  open: { label: 'Abierto', cls: 'border-emerald-400/50 text-emerald-300 bg-emerald-400/10' },
  live: { label: 'En vivo', cls: 'border-blood/60 text-blood-light bg-blood/15' },
  closed: { label: 'Cerrado', cls: 'border-amber-gold/50 text-amber-gold bg-amber-gold/10' },
};

export default async function DashboardHome() {
  const organizer = await requireOrganizer();
  const tournaments = await loadOrganizerTournaments(organizer.id);
  const stats = aggregateStats(tournaments);

  return (
    <div>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-gold/80 mb-2">
            ORGANIZADOR
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-white">
            Hola, <span className="text-amber-gold">{organizer.display_name}</span>
          </h1>
        </div>
        <Link href="/dashboard/torneos/nuevo" className="btn-primary inline-flex">
          + Crear torneo
        </Link>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <Stat label="Torneos" value={stats.tournaments} />
        <Stat label="Equipos totales" value={stats.teams} />
        <Stat label="Revenue total" value={`USD $${stats.revenue.toFixed(0)}`} />
      </div>

      <section>
        <h2 className="font-display text-xl text-white mb-4">Tus torneos</h2>

        {tournaments.length === 0 ? (
          <div className="border border-dashed border-white/15 p-10 text-center">
            <p className="text-white/65 mb-4">Todavía no creaste ningún torneo.</p>
            <Link href="/dashboard/torneos/nuevo" className="btn-primary inline-flex">
              Crear el primero →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((t) => {
              const badge = STATUS_BADGE[t.status] ?? STATUS_BADGE.draft;
              return (
                <div
                  key={t.id}
                  className="border border-white/10 bg-black/30 p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.18em] border px-2 py-0.5 ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                        {t.format.replace(/_/g, ' ')} · {t.game}
                      </span>
                    </div>
                    <h3 className="font-display text-lg text-white">{t.name}</h3>
                    <div className="font-mono text-xs text-white/45 mt-1">
                      {t.teams_count}/{t.max_teams} equipos · {t.paid_count} pagos · USD $
                      {Number(t.revenue_usd).toFixed(0)} revenue
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/torneos/${t.slug}`}
                      className="font-mono text-[10px] uppercase tracking-[0.18em] border border-white/15 hover:border-white/30 px-3 py-2 text-white/70 hover:text-white"
                    >
                      Ver pública →
                    </Link>
                    <Link
                      href={`/dashboard/torneos/${t.slug}`}
                      className="font-mono text-[10px] uppercase tracking-[0.18em] border border-amber-gold/40 bg-amber-gold/5 hover:bg-amber-gold/15 px-3 py-2 text-amber-gold"
                    >
                      Editar / Admin →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-white/10 bg-black/35 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1">
        {label}
      </div>
      <div className="font-display text-2xl text-white">{value}</div>
    </div>
  );
}
