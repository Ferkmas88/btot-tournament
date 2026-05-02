import { NextResponse } from 'next/server';
import { fetchSteamProfile, steamId64To32, verifyOpenIDResponse } from '@/lib/steam';
import { fetchOpenDotaMmr } from '@/lib/opendota';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login?next=/perfil', url.origin));
  }

  const steamId64 = await verifyOpenIDResponse(url.searchParams);
  if (!steamId64) {
    return NextResponse.redirect(new URL('/perfil?steam_error=verify_failed', url.origin));
  }

  // Fetch perfil Steam (persona + avatar) si hay STEAM_API_KEY.
  const profile = await fetchSteamProfile(steamId64);

  // Fetch MMR de OpenDota (best effort — puede ser null).
  const steamId32 = steamId64To32(steamId64);
  const mmr = await fetchOpenDotaMmr(steamId32);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      steam_id_64: steamId64,
      steam_persona: profile?.personaname ?? null,
      steam_avatar_url: profile?.avatarfull ?? null,
      mmr_estimate: mmr,
      mmr_cached_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    // Caso comun: steam_id_64 ya esta usado por otra cuenta (UNIQUE).
    if (error.code === '23505') {
      return NextResponse.redirect(new URL('/perfil?steam_error=already_linked', url.origin));
    }
    return NextResponse.redirect(
      new URL(`/perfil?steam_error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL('/perfil?steam_ok=1', url.origin));
}
