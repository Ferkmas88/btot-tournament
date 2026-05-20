import { getServiceClient } from './supabase';

export type TournamentFormat =
  | 'single_elim'
  | 'double_elim'
  | 'round_robin'
  | 'groups_playoffs';

export type TournamentStatus = 'draft' | 'open' | 'live' | 'closed';

export type PrizeDistribution = Record<string, number>;

export type Tournament = {
  id: string;
  organizer_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  game: string;
  format: TournamentFormat;
  max_teams: number;
  team_size: number;
  coach_required: boolean;
  substitutes_allowed: number;

  // Eligibility
  mmr_min: number | null;
  mmr_max_per_team: number | null;
  rank_min: string | null;
  required_immortal_per_team: number;

  // Pricing
  entry_fee_per_player_usd: number;
  entry_fee_per_team_usd: number;

  // Prize pool
  prize_pool_usd: number;
  prize_distribution: PrizeDistribution | null;
  prize_pool_pct: number;

  // Schedule
  starts_at: string | null;
  registration_closes_at: string | null;
  schedule_notes: string | null;

  // Rules
  servers_allowed: string[] | null;
  anti_cheat_rules: string | null;
  refund_policy_days: number;
  payment_methods: string[];

  status: TournamentStatus;
  created_at: string;
  updated_at: string | null;
};

export type Organizer = {
  id: string;
  display_name: string;
  contact_whatsapp: string | null;
  contact_telegram: string | null;
  contact_discord: string | null;
  contact_email: string | null;
  bio: string | null;
  avatar_url: string | null;
};

const TOURNAMENT_COLS = [
  'id',
  'organizer_id',
  'slug',
  'name',
  'description',
  'game',
  'format',
  'max_teams',
  'team_size',
  'coach_required',
  'substitutes_allowed',
  'mmr_min',
  'mmr_max_per_team',
  'rank_min',
  'required_immortal_per_team',
  'entry_fee_per_player_usd',
  'entry_fee_per_team_usd',
  'prize_pool_usd',
  'prize_distribution',
  'prize_pool_pct',
  'starts_at',
  'registration_closes_at',
  'schedule_notes',
  'servers_allowed',
  'anti_cheat_rules',
  'refund_policy_days',
  'payment_methods',
  'status',
  'created_at',
  'updated_at',
].join(', ');

const ORGANIZER_COLS =
  'id, display_name, contact_whatsapp, contact_telegram, contact_discord, contact_email, bio, avatar_url';

let cache: { value: Tournament | null; ts: number } | null = null;
const CACHE_MS = 30_000;

export async function getActiveTournament(): Promise<Tournament | null> {
  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.value;

  const supabase = getServiceClient();
  const { data } = await supabase
    .from('tournaments')
    .select(TOURNAMENT_COLS)
    .in('status', ['open', 'live'])
    .order('starts_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  cache = { value: (data as Tournament | null) ?? null, ts: Date.now() };
  return cache.value;
}

export async function getActiveOrLatestTournament(): Promise<Tournament | null> {
  const active = await getActiveTournament();
  if (active) return active;

  const supabase = getServiceClient();
  const { data } = await supabase
    .from('tournaments')
    .select(TOURNAMENT_COLS)
    .in('status', ['closed'])
    .order('starts_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Tournament | null) ?? null;
}

export async function getTournamentBySlug(slug: string): Promise<Tournament | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('tournaments')
    .select(TOURNAMENT_COLS)
    .eq('slug', slug)
    .maybeSingle();
  return (data as Tournament | null) ?? null;
}

export async function getOrganizer(organizerId: string): Promise<Organizer | null> {
  if (!organizerId) return null;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('organizers')
    .select(ORGANIZER_COLS)
    .eq('id', organizerId)
    .maybeSingle();
  return (data as Organizer | null) ?? null;
}

/**
 * Helper para construir un wa.me link sin doble protocolo. Acepta números con
 * o sin `+`, con o sin espacios/guiones.
 */
export function whatsappLink(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function invalidateTournamentCache(): void {
  cache = null;
}
