import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOrganizer } from '@/lib/organizer';
import { getServiceClient } from '@/lib/supabase';
import TournamentAdminPanel from '@/components/TournamentAdminPanel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = { params: Promise<{ slug: string }> };

type TeamRow = {
  id: string;
  team_name: string;
  captain_name: string;
  captain_email: string | null;
  captain_contact: string;
  province: string | null;
  payment_status: 'pending' | 'paid' | 'refunded' | 'free' | null;
  payment_method: 'card' | 'offline' | null;
  payment_amount_usd: number | null;
  created_at: string;
};

export default async function OrganizerTournamentPage({ params }: Props) {
  const { slug } = await params;
  const organizer = await requireOrganizer();
  const supabase = getServiceClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select(
      'id, slug, name, status, format, max_teams, entry_fee_per_team_usd, prize_pool_usd, starts_at, registration_closes_at',
    )
    .eq('slug', slug)
    .eq('organizer_id', organizer.id)
    .maybeSingle();

  if (!tournament) notFound();

  const { data: teams } = await supabase
    .from('teams')
    .select(
      'id, team_name, captain_name, captain_email, captain_contact, province, payment_status, payment_method, payment_amount_usd, created_at',
    )
    .eq('tournament_id', tournament.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <Link href="/dashboard" className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1 mb-6">
        ← Dashboard
      </Link>

      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-gold/80 mb-2">
          {tournament.format} · {tournament.status}
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-white">{tournament.name}</h1>
        <p className="text-white/55 text-sm mt-2">
          {teams?.length ?? 0}/{tournament.max_teams} equipos
          {Number(tournament.entry_fee_per_team_usd) > 0 &&
            ` · USD ${Number(tournament.entry_fee_per_team_usd).toFixed(0)}/equipo`}
          {Number(tournament.prize_pool_usd) > 0 &&
            ` · prize pool USD ${Number(tournament.prize_pool_usd).toFixed(0)}`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/torneos/${tournament.slug}`}
            className="font-mono text-[10px] uppercase tracking-[0.18em] border border-white/15 hover:border-white/30 px-3 py-2 text-white/70 hover:text-white"
          >
            Ver pública →
          </Link>
          <Link
            href={`/torneos/${tournament.slug}/politica`}
            className="font-mono text-[10px] uppercase tracking-[0.18em] border border-white/15 hover:border-white/30 px-3 py-2 text-white/70 hover:text-white"
          >
            Política inscripción →
          </Link>
        </div>
      </header>

      <TournamentAdminPanel
        tournamentSlug={tournament.slug}
        currentStatus={tournament.status as 'draft' | 'open' | 'live' | 'closed'}
        teams={(teams ?? []) as TeamRow[]}
      />
    </div>
  );
}
