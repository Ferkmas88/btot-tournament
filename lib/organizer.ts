import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase-server';
import { getServiceClient } from './supabase';
import { getUser } from './auth';
import type { Organizer, Tournament } from './tournaments';

export async function getCurrentOrganizer(): Promise<Organizer | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('organizers')
    .select(
      'id, display_name, contact_whatsapp, contact_telegram, contact_discord, contact_email, bio, avatar_url',
    )
    .eq('user_id', user.id)
    .maybeSingle();
  return (data as Organizer | null) ?? null;
}

export async function requireOrganizer(): Promise<Organizer> {
  const user = await getUser();
  if (!user) redirect('/organizer/login?next=/dashboard');
  const org = await getCurrentOrganizer();
  if (!org) redirect('/organizer/signup?next=/dashboard');
  return org;
}

export type OrganizerTournament = Pick<
  Tournament,
  | 'id'
  | 'slug'
  | 'name'
  | 'game'
  | 'format'
  | 'status'
  | 'max_teams'
  | 'entry_fee_per_team_usd'
  | 'starts_at'
  | 'created_at'
> & {
  teams_count: number;
  paid_count: number;
  revenue_usd: number;
};

/**
 * Carga torneos del organizer + stats agregadas (equipos / pagos / revenue).
 * Usa service client para hacer counts agregados sin pelear con RLS.
 */
export async function loadOrganizerTournaments(
  organizerId: string,
): Promise<OrganizerTournament[]> {
  const admin = getServiceClient();

  const { data: tournaments } = await admin
    .from('tournaments')
    .select(
      'id, slug, name, game, format, status, max_teams, entry_fee_per_team_usd, starts_at, created_at',
    )
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false });

  if (!tournaments?.length) return [];

  const ids = tournaments.map((t) => t.id as string);
  const { data: teams } = await admin
    .from('teams')
    .select('tournament_id, payment_status, payment_amount_usd')
    .in('tournament_id', ids);

  const byTournament = new Map<
    string,
    { total: number; paid: number; revenue: number }
  >();
  for (const t of teams ?? []) {
    const tid = t.tournament_id as string;
    const agg = byTournament.get(tid) ?? { total: 0, paid: 0, revenue: 0 };
    agg.total += 1;
    if (t.payment_status === 'paid') {
      agg.paid += 1;
      agg.revenue += Number(t.payment_amount_usd ?? 0);
    }
    byTournament.set(tid, agg);
  }

  return tournaments.map((t) => {
    const agg = byTournament.get(t.id as string) ?? { total: 0, paid: 0, revenue: 0 };
    return {
      ...(t as OrganizerTournament),
      teams_count: agg.total,
      paid_count: agg.paid,
      revenue_usd: agg.revenue,
    };
  });
}

export function aggregateStats(rows: OrganizerTournament[]) {
  return rows.reduce(
    (acc, r) => {
      acc.tournaments += 1;
      acc.teams += r.teams_count;
      acc.revenue += r.revenue_usd;
      return acc;
    },
    { tournaments: 0, teams: 0, revenue: 0 },
  );
}
