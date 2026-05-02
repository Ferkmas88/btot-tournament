// OpenDota API helper. No requiere key.
// Endpoint: GET https://api.opendota.com/api/players/{steam32}

const OPENDOTA_BASE = process.env.OPENDOTA_BASE ?? 'https://api.opendota.com/api';

export type OpenDotaPlayer = {
  mmr_estimate?: { estimate?: number | null } | null;
  rank_tier?: number | null;
  leaderboard_rank?: number | null;
  profile?: {
    personaname?: string;
    avatarfull?: string;
    profileurl?: string;
  } | null;
};

export type OpenDotaSummary = {
  mmrEstimate: number | null;     // mejor estimate disponible (mmr_estimate o rank_tier)
  rankLabel: string | null;       // ej "Archon 5", "Immortal #1234"
  personaname: string | null;
  avatarUrl: string | null;
};

const MEDAL_NAMES = ['Uncalibrated', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
// MMR aproximado al inicio de cada medal (Herald 1 = 0, Guardian 1 = ~616, etc).
const MEDAL_MMR_BASE = [0, 0, 616, 1232, 1848, 2464, 3080, 3696, 5420];

function rankTierToMmr(tier: number): number | null {
  if (!tier) return null;
  const medal = Math.floor(tier / 10);
  const stars = tier % 10;
  if (medal < 1 || medal > 8) return null;
  if (medal === 8) return 5420; // Immortal: usar mmr base, leaderboard_rank lo afina si existe
  const base = MEDAL_MMR_BASE[medal];
  // 154 MMR por estrella (616 / 4 estrellas entre cada medal de 5 a 1 estrellas siguiente).
  return base + (stars - 1) * 154;
}

function rankTierToLabel(tier: number, leaderboard?: number | null): string | null {
  if (!tier) return null;
  const medal = Math.floor(tier / 10);
  const stars = tier % 10;
  if (medal < 1 || medal > 8) return null;
  const name = MEDAL_NAMES[medal];
  if (medal === 8) return leaderboard ? `Immortal #${leaderboard}` : 'Immortal';
  return `${name} ${stars}`;
}

export async function fetchOpenDotaSummary(steamId32: string): Promise<OpenDotaSummary> {
  const empty: OpenDotaSummary = { mmrEstimate: null, rankLabel: null, personaname: null, avatarUrl: null };
  try {
    const res = await fetch(`${OPENDOTA_BASE}/players/${steamId32}`, { cache: 'no-store' });
    if (!res.ok) return empty;
    const data = (await res.json()) as OpenDotaPlayer;
    const estimate = typeof data.mmr_estimate?.estimate === 'number' ? data.mmr_estimate!.estimate : null;
    const tierMmr = data.rank_tier ? rankTierToMmr(data.rank_tier) : null;
    return {
      mmrEstimate: estimate ?? tierMmr ?? null,
      rankLabel: data.rank_tier ? rankTierToLabel(data.rank_tier, data.leaderboard_rank) : null,
      personaname: data.profile?.personaname ?? null,
      avatarUrl: data.profile?.avatarfull ?? null,
    };
  } catch {
    return empty;
  }
}

// Backward-compat: solo MMR.
export async function fetchOpenDotaMmr(steamId32: string): Promise<number | null> {
  const summary = await fetchOpenDotaSummary(steamId32);
  return summary.mmrEstimate;
}
