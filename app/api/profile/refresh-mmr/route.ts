import { NextResponse } from 'next/server';
import { steamId64To32 } from '@/lib/steam';
import { fetchOpenDotaMmr } from '@/lib/opendota';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentProfile, getUser } from '@/lib/auth';

export const runtime = 'nodejs';

const MIN_INTERVAL_MS = 60 * 60 * 1000; // 1 hora entre refresh

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
  }
  if (!profile.steam_id_64) {
    return NextResponse.json({ error: 'Linkeá Steam primero' }, { status: 400 });
  }

  if (profile.mmr_cached_at) {
    const last = new Date(profile.mmr_cached_at).getTime();
    if (Date.now() - last < MIN_INTERVAL_MS) {
      return NextResponse.json(
        { error: 'Esperá al menos 1 hora entre refreshes' },
        { status: 429 },
      );
    }
  }

  const steamId32 = steamId64To32(profile.steam_id_64);
  const mmr = await fetchOpenDotaMmr(steamId32);

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('profiles')
    .update({
      mmr_estimate: mmr,
      mmr_cached_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  return NextResponse.json({ ok: true, mmr_estimate: mmr });
}
