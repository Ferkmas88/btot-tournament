// Steam OpenID 2.0 helpers + Steam Web API fetch.
// OpenID 2.0 es legacy pero es lo unico que Steam soporta. NO usar libs OAuth modernas.

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const STEAM_API_BASE = 'https://api.steampowered.com';

export type SteamProfile = {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
};

export function getAppOrigin(req?: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit;
  if (req) {
    const url = new URL(req.url);
    return url.origin;
  }
  return 'http://localhost:3000';
}

export function buildOpenIDLoginUrl(origin: string): string {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${origin}/api/auth/steam/callback`,
    'openid.realm': origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

// Verifica con Steam que la respuesta OpenID es legitima.
// Sin esto cualquiera puede falsificar el callback.
export async function verifyOpenIDResponse(searchParams: URLSearchParams): Promise<string | null> {
  const verifyParams = new URLSearchParams();
  searchParams.forEach((value, key) => verifyParams.append(key, value));
  verifyParams.set('openid.mode', 'check_authentication');

  const res = await fetch(STEAM_OPENID_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
    cache: 'no-store',
  });

  const body = await res.text();
  if (!body.includes('is_valid:true')) return null;

  // claimed_id formato: https://steamcommunity.com/openid/id/76561198XXXXXXXX
  const claimedId = searchParams.get('openid.claimed_id');
  if (!claimedId) return null;
  const match = claimedId.match(/\/(\d{17})$/);
  return match ? match[1] : null;
}

export async function fetchSteamProfile(steamId64: string): Promise<SteamProfile | null> {
  const key = process.env.STEAM_API_KEY;
  if (!key) return null;

  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${steamId64}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;

  const json = (await res.json()) as { response?: { players?: SteamProfile[] } };
  return json.response?.players?.[0] ?? null;
}

// Steam ID 64 → 32 (para OpenDota y otros).
export function steamId64To32(id64: string): string {
  const STEAM_BASE = BigInt('76561197960265728');
  const id = BigInt(id64) - STEAM_BASE;
  return id.toString();
}
