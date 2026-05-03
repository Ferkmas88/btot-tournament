import { getServiceClient } from '@/lib/supabase';

export type RRMatch = {
  id: string;
  team_a_id: string;
  team_b_id: string;
  score_a: number;
  score_b: number;
  winner_id: string | null;
  status: 'pending' | 'in_progress' | 'done';
  scheduled_at: string | null;
};

export type TeamLite = { id: string; team_name: string; province: string };

export type Standing = {
  team: TeamLite;
  pj: number; // partidos jugados
  v: number;  // victorias
  d: number;  // derrotas
  pts: number; // 3 por victoria
  gw: number; // games won (juegos individuales)
  gl: number; // games lost
  gd: number; // game diff
};

export async function loadRoundRobin(): Promise<{
  teams: TeamLite[];
  matches: RRMatch[];
  standings: Standing[];
}> {
  const supabase = getServiceClient();
  const [teamsRes, matchesRes] = await Promise.all([
    supabase
      .from('teams')
      .select('id, team_name, province')
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: true }),
    supabase
      .from('round_robin_matches')
      .select('id, team_a_id, team_b_id, score_a, score_b, winner_id, status, scheduled_at')
      .order('created_at', { ascending: true }),
  ]);

  if (teamsRes.error) throw new Error(teamsRes.error.message);
  if (matchesRes.error) throw new Error(matchesRes.error.message);

  const teams = (teamsRes.data ?? []) as TeamLite[];
  const matches = (matchesRes.data ?? []) as RRMatch[];

  const standings = computeStandings(teams, matches);
  return { teams, matches, standings };
}

export function computeStandings(teams: TeamLite[], matches: RRMatch[]): Standing[] {
  const map = new Map<string, Standing>();
  for (const t of teams) {
    map.set(t.id, { team: t, pj: 0, v: 0, d: 0, pts: 0, gw: 0, gl: 0, gd: 0 });
  }

  for (const m of matches) {
    if (m.status !== 'done') continue;
    const a = map.get(m.team_a_id);
    const b = map.get(m.team_b_id);
    if (!a || !b) continue;

    a.pj += 1;
    b.pj += 1;
    a.gw += m.score_a;
    a.gl += m.score_b;
    b.gw += m.score_b;
    b.gl += m.score_a;

    if (m.winner_id === m.team_a_id) {
      a.v += 1;
      b.d += 1;
    } else if (m.winner_id === m.team_b_id) {
      b.v += 1;
      a.d += 1;
    }
  }

  // Pts = 3 por cada juego individual ganado (no por match BO3).
  // Asi 2-0 = 6 pts, 2-1 ganador = 6 pts + perdedor = 3 pts.
  // Recompensa partidas peleadas y refleja calidad jugada.
  for (const s of map.values()) {
    s.gd = s.gw - s.gl;
    s.pts = s.gw * 3;
  }

  return Array.from(map.values()).sort((x, y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.gd !== x.gd) return y.gd - x.gd;
    if (y.gw !== x.gw) return y.gw - x.gw;
    return x.team.team_name.localeCompare(y.team.team_name);
  });
}

// Genera todos los pares posibles (n*(n-1)/2). Idempotente con unique constraint.
export function generatePairs(teamIds: string[]): { a: string; b: string }[] {
  const pairs: { a: string; b: string }[] = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push({ a: teamIds[i], b: teamIds[j] });
    }
  }
  return pairs;
}
