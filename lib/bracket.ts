import { getServiceClient } from '@/lib/supabase';

export type Slot = 'cuartos1' | 'cuartos2' | 'semi1' | 'semi2' | 'final';

export const ALL_SLOTS: Slot[] = ['cuartos1', 'cuartos2', 'semi1', 'semi2', 'final'];

export type MatchRow = {
  id: string;
  slot: Slot;
  team_a_id: string | null;
  team_b_id: string | null;
  winner_id: string | null;
  status: 'pending' | 'in_progress' | 'done';
  scheduled_at: string | null;
};

export type TeamLite = {
  id: string;
  team_name: string;
  province: string;
};

export type MatchView = MatchRow & {
  team_a: TeamLite | null;
  team_b: TeamLite | null;
  winner: TeamLite | null;
};

export async function loadBracket(): Promise<{
  matches: Record<Slot, MatchView>;
  teams: TeamLite[];
}> {
  const supabase = getServiceClient();

  const [matchesRes, teamsRes] = await Promise.all([
    supabase.from('matches').select('*'),
    supabase
      .from('teams')
      .select('id, team_name, province')
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: true }),
  ]);

  if (matchesRes.error) throw new Error(matchesRes.error.message);
  if (teamsRes.error) throw new Error(teamsRes.error.message);

  const teams = (teamsRes.data ?? []) as TeamLite[];
  const teamById = new Map(teams.map((t) => [t.id, t]));

  const matches: Record<Slot, MatchView> = {} as Record<Slot, MatchView>;
  for (const m of (matchesRes.data ?? []) as MatchRow[]) {
    matches[m.slot] = {
      ...m,
      team_a: m.team_a_id ? teamById.get(m.team_a_id) ?? null : null,
      team_b: m.team_b_id ? teamById.get(m.team_b_id) ?? null : null,
      winner: m.winner_id ? teamById.get(m.winner_id) ?? null : null,
    };
  }

  // Defensive: ensure 5 rows exist
  for (const slot of ALL_SLOTS) {
    if (!matches[slot]) {
      matches[slot] = {
        id: '',
        slot,
        team_a_id: null,
        team_b_id: null,
        winner_id: null,
        status: 'pending',
        scheduled_at: null,
        team_a: null,
        team_b: null,
        winner: null,
      };
    }
  }

  return { matches, teams };
}
