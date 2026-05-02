// OpenDota API helper. No requiere key.
// Endpoint: GET https://api.opendota.com/api/players/{steam32}
// mmr_estimate.estimate puede ser null si el jugador no tiene matches publicos.

const OPENDOTA_BASE = process.env.OPENDOTA_BASE ?? 'https://api.opendota.com/api';

export type OpenDotaPlayer = {
  mmr_estimate?: { estimate?: number | null } | null;
  profile?: {
    personaname?: string;
    avatarfull?: string;
  } | null;
};

export async function fetchOpenDotaMmr(steamId32: string): Promise<number | null> {
  try {
    const res = await fetch(`${OPENDOTA_BASE}/players/${steamId32}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as OpenDotaPlayer;
    const mmr = data.mmr_estimate?.estimate;
    return typeof mmr === 'number' ? mmr : null;
  } catch {
    return null;
  }
}
