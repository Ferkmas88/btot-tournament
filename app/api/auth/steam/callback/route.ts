import { NextResponse } from 'next/server';
import { fetchSteamProfile, steamId64To32, verifyOpenIDResponse } from '@/lib/steam';
import { fetchOpenDotaMmr } from '@/lib/opendota';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getUser } from '@/lib/auth';

export const runtime = 'nodejs';

function syntheticEmail(steamId64: string): string {
  return `${steamId64}@steam.papaque.local`;
}

function randomPassword(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const steamId64 = await verifyOpenIDResponse(url.searchParams);
  if (!steamId64) {
    return NextResponse.redirect(new URL('/auth/login?steam_error=verify_failed', url.origin));
  }

  // Fetch Steam profile (persona + avatar) si hay STEAM_API_KEY.
  const profile = await fetchSteamProfile(steamId64);
  const steamId32 = steamId64To32(steamId64);
  const mmr = await fetchOpenDotaMmr(steamId32);

  const admin = getSupabaseAdmin();
  const currentUser = await getUser();

  // CASO 1: usuario logueado linkeando Steam a su cuenta existente.
  if (currentUser) {
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
      .eq('id', currentUser.id);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.redirect(new URL('/perfil?steam_error=already_linked', url.origin));
      }
      return NextResponse.redirect(
        new URL(`/perfil?steam_error=${encodeURIComponent(error.message)}`, url.origin),
      );
    }
    return NextResponse.redirect(new URL('/perfil?steam_ok=1', url.origin));
  }

  // CASO 2 / 3: usuario anónimo entrando por Steam.
  // Buscar perfil con ese steam_id_64.
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, email')
    .eq('steam_id_64', steamId64)
    .maybeSingle();

  let userEmail: string;

  if (existingProfile) {
    // CASO 2: ya existe cuenta linkeada a este Steam → loguear.
    userEmail = existingProfile.email;
    // Refrescar persona/avatar/mmr si cambió.
    await admin
      .from('profiles')
      .update({
        steam_persona: profile?.personaname ?? existingProfile.email,
        steam_avatar_url: profile?.avatarfull ?? null,
        mmr_estimate: mmr,
        mmr_cached_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingProfile.id);
  } else {
    // CASO 3: cuenta nueva. Crear user con email sintético y password random.
    const email = syntheticEmail(steamId64);
    const displayName = profile?.personaname ?? `player_${steamId32}`;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: randomPassword(),
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    if (createErr || !created.user) {
      // Si email ya existe (race), reintentar lookup.
      const { data: retryProfile } = await admin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();
      if (!retryProfile) {
        return NextResponse.redirect(
          new URL(
            `/auth/login?steam_error=${encodeURIComponent(createErr?.message ?? 'create_failed')}`,
            url.origin,
          ),
        );
      }
      userEmail = retryProfile.email;
    } else {
      userEmail = email;
      // Trigger creó profiles. Update con datos Steam.
      await admin
        .from('profiles')
        .update({
          steam_id_64: steamId64,
          steam_persona: profile?.personaname ?? null,
          steam_avatar_url: profile?.avatarfull ?? null,
          mmr_estimate: mmr,
          mmr_cached_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', created.user.id);
    }
  }

  // Generar magic link y redirigir. Magic link redirige a /auth/callback?code=...
  // que ya maneja exchangeCodeForSession y deja al user logueado.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: userEmail,
    options: {
      redirectTo: `${url.origin}/auth/callback?next=/perfil`,
    },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?steam_error=${encodeURIComponent(linkErr?.message ?? 'link_failed')}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(linkData.properties.action_link);
}
