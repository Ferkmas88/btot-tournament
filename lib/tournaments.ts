import { getServiceClient } from './supabase';

export type Tournament = {
  id: string;
  slug: string;
  name: string;
  game: string;
  format: 'single_elim' | 'double_elim' | 'round_robin';
  max_teams: number;
  team_size: number;
  entry_fee_usd: number;
  prize_pool_pct: number;
  status: 'draft' | 'open' | 'live' | 'closed';
  starts_at: string | null;
  registration_closes_at: string | null;
  created_at: string;
};

const TOURNAMENT_COLS =
  'id, slug, name, game, format, max_teams, team_size, entry_fee_usd, prize_pool_pct, status, starts_at, registration_closes_at, created_at';

let cache: { value: Tournament | null; ts: number } | null = null;
const CACHE_MS = 30_000;

/**
 * Active tournament = el primero con status='open' o 'live'.
 * Backfill garantiza Papaque #1 ('closed') queda como fallback para queries
 * de páginas históricas (round-robin, bracket).
 */
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

/**
 * Active tournament o el último jugado (status='closed'). Útil para páginas
 * públicas (round-robin, bracket) que tienen que mostrar algo aunque no haya
 * torneo abierto.
 */
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

export function invalidateTournamentCache(): void {
  cache = null;
}
