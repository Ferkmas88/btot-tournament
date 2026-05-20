import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServiceClient } from '@/lib/supabase';
import { getOrganizer, whatsappLink, type Tournament } from '@/lib/tournaments';
import { getCurrentOrganizer } from '@/lib/organizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('tournaments')
    .select('name, description')
    .eq('slug', slug)
    .maybeSingle();
  return {
    title: data?.name ? `${data.name} · Papaque` : 'Torneo · Papaque',
    description: data?.description ?? undefined,
  };
}

async function loadTournament(slug: string) {
  const supabase = getServiceClient();
  const { data } = await supabase.from('tournaments').select('*').eq('slug', slug).maybeSingle();
  return (data as Tournament | null) ?? null;
}

async function countTeams(tournamentId: string): Promise<number> {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .in('payment_status', ['paid', 'free']);
  return count ?? 0;
}

export default async function TournamentPublicPage({ params }: Props) {
  const { slug } = await params;
  const tournament = await loadTournament(slug);
  if (!tournament) notFound();

  // Drafts: solo el organizer dueño puede ver.
  if (tournament.status === 'draft') {
    const me = await getCurrentOrganizer();
    if (!me || me.id !== tournament.organizer_id) {
      notFound();
    }
  }

  const organizer = tournament.organizer_id ? await getOrganizer(tournament.organizer_id) : null;
  const teamsCount = await countTeams(tournament.id);
  const waHref = whatsappLink(organizer?.contact_whatsapp);

  const fmt = formatLabel(tournament.format);
  const isOpen = tournament.status === 'open';
  const isLive = tournament.status === 'live';

  return (
    <main className="min-h-screen">
      <section className="relative px-4 py-14 md:py-20 border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-gold/5 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <Link
            href="/torneos"
            className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1 mb-6"
          >
            ← Todos los torneos
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <StatusBadge status={tournament.status} />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
              {tournament.game}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">·</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{fmt}</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl text-white leading-tight mb-4">
            {tournament.name}
          </h1>

          {tournament.description && (
            <p className="text-white/70 text-base md:text-lg max-w-2xl mb-6">
              {tournament.description}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mb-8">
            <Stat label="Prize pool" value={`USD $${Number(tournament.prize_pool_usd).toFixed(0)}`} />
            <Stat
              label="Equipos"
              value={`${teamsCount}/${tournament.max_teams}`}
            />
            <Stat
              label="Por equipo"
              value={
                Number(tournament.entry_fee_per_team_usd) > 0
                  ? `USD $${Number(tournament.entry_fee_per_team_usd).toFixed(0)}`
                  : 'Gratis'
              }
            />
            <Stat
              label="Tamaño"
              value={`${tournament.team_size}v${tournament.team_size}`}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {(isOpen || isLive) && (
              <Link
                href={`/torneos/${tournament.slug}/inscribirse`}
                className="btn-primary inline-flex"
              >
                {isLive ? 'Ver torneo en vivo →' : 'Inscribir equipo →'}
              </Link>
            )}
            <Link
              href={`/torneos/${tournament.slug}/politica`}
              className="btn-secondary inline-flex"
            >
              Política de inscripción
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {tournament.prize_distribution && Object.keys(tournament.prize_distribution).length > 0 && (
          <Section title="Distribución del prize pool">
            <div className="grid grid-cols-3 gap-3 max-w-lg">
              {Object.entries(tournament.prize_distribution).map(([place, amount]) => (
                <div key={place} className="border border-amber-gold/20 bg-amber-gold/5 p-4 text-center">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-gold/80">
                    {place}
                  </div>
                  <div className="font-display text-2xl text-white mt-1">USD ${Number(amount).toFixed(0)}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Requisitos del equipo">
          <ul className="space-y-2 text-white/75 text-sm">
            <li>
              <strong className="text-white">{tournament.team_size} jugadores titulares</strong>
              {tournament.coach_required ? ' + coach obligatorio' : ''}.
              {tournament.substitutes_allowed > 0
                ? ` Hasta ${tournament.substitutes_allowed} sustitutos permitidos.`
                : ''}
            </li>
            {tournament.mmr_min ? (
              <li>
                MMR mínimo individual: <strong className="text-white">{tournament.mmr_min}</strong>.
              </li>
            ) : null}
            {tournament.mmr_max_per_team ? (
              <li>
                MMR máximo por equipo (suma): <strong className="text-white">{tournament.mmr_max_per_team}</strong>.
              </li>
            ) : null}
            {tournament.rank_min ? (
              <li>
                Rank mínimo: <strong className="text-white">{tournament.rank_min}</strong>.
              </li>
            ) : null}
            {tournament.required_immortal_per_team > 0 ? (
              <li>
                Mínimo <strong className="text-white">{tournament.required_immortal_per_team}</strong>{' '}
                jugador(es) Immortal por equipo.
              </li>
            ) : null}
          </ul>
        </Section>

        {tournament.schedule_notes && (
          <Section title="Schedule">
            <p className="text-white/75 text-sm whitespace-pre-line">{tournament.schedule_notes}</p>
            {tournament.starts_at && (
              <p className="font-mono text-[11px] text-white/45 mt-3">
                Inicio: {new Date(tournament.starts_at).toLocaleString()}
              </p>
            )}
            {tournament.registration_closes_at && (
              <p className="font-mono text-[11px] text-white/45">
                Cierre inscripciones: {new Date(tournament.registration_closes_at).toLocaleString()}
              </p>
            )}
          </Section>
        )}

        {(tournament.servers_allowed?.length ?? 0) > 0 && (
          <Section title="Servers permitidos">
            <div className="flex flex-wrap gap-2">
              {tournament.servers_allowed!.map((s) => (
                <span
                  key={s}
                  className="font-mono text-[11px] uppercase tracking-[0.15em] border border-white/15 px-3 py-1.5 text-white/75"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {tournament.anti_cheat_rules && (
          <Section title="Reglas anti-cheat">
            <p className="text-white/75 text-sm whitespace-pre-line">{tournament.anti_cheat_rules}</p>
          </Section>
        )}

        <Section title="Pagos y reembolsos">
          <ul className="space-y-2 text-white/75 text-sm">
            <li>
              Entry fee:{' '}
              <strong className="text-white">
                USD ${Number(tournament.entry_fee_per_team_usd).toFixed(0)}/equipo
              </strong>
              {Number(tournament.entry_fee_per_player_usd) > 0
                ? ` (${tournament.team_size} × USD ${Number(tournament.entry_fee_per_player_usd).toFixed(0)}/jugador)`
                : ''}
              .
            </li>
            <li>
              Métodos aceptados:{' '}
              <strong className="text-white">
                {(tournament.payment_methods ?? ['card']).map(paymentMethodLabel).join(', ')}
              </strong>
              .
            </li>
            <li>
              Reembolsos: hasta <strong className="text-white">{tournament.refund_policy_days}</strong>{' '}
              día(s) antes del inicio.
            </li>
          </ul>
        </Section>

        {organizer && (
          <Section title="Organizador">
            <div className="border border-white/10 bg-black/30 p-5">
              <div className="font-display text-xl text-white">{organizer.display_name}</div>
              {organizer.bio && <p className="text-white/65 text-sm mt-1">{organizer.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] uppercase tracking-[0.15em] border border-amber-gold/40 bg-amber-gold/5 hover:bg-amber-gold/15 text-amber-gold px-3 py-1.5"
                  >
                    WhatsApp →
                  </a>
                )}
                {organizer.contact_discord && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] border border-white/15 px-3 py-1.5 text-white/65">
                    Discord: {organizer.contact_discord}
                  </span>
                )}
                {organizer.contact_telegram && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] border border-white/15 px-3 py-1.5 text-white/65">
                    Telegram: {organizer.contact_telegram}
                  </span>
                )}
              </div>
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl text-white mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/35 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1">{label}</div>
      <div className="font-display text-xl text-white">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Tournament['status'] }) {
  const map: Record<Tournament['status'], { label: string; cls: string }> = {
    draft: { label: 'Borrador', cls: 'border-white/20 text-white/55 bg-white/5' },
    open: { label: 'Inscripciones abiertas', cls: 'border-emerald-400/50 text-emerald-300 bg-emerald-400/10' },
    live: { label: 'En vivo', cls: 'border-blood/60 text-blood-light bg-blood/15' },
    closed: { label: 'Cerrado', cls: 'border-amber-gold/50 text-amber-gold bg-amber-gold/10' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.18em] border px-2 py-0.5 ${cls}`}>
      {label}
    </span>
  );
}

function formatLabel(f: Tournament['format']): string {
  switch (f) {
    case 'single_elim':
      return 'Single elimination';
    case 'double_elim':
      return 'Double elimination';
    case 'round_robin':
      return 'Round robin';
    case 'groups_playoffs':
      return 'Grupos + playoffs';
    default:
      return f;
  }
}

function paymentMethodLabel(m: string): string {
  if (m === 'card') return 'Tarjeta (Lemon Squeezy)';
  if (m === 'whatsapp_alt') return 'WhatsApp (WU / Remitly / efectivo / wire)';
  return m;
}
