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
  const email = syntheticEmail(steamId64);
  const displayName = profile?.personaname ?? `player_${steamId32}`;

  // 1. Buscar profile por steam_id_64 (caso normal repetido).
  let userId: string | null = null;
  let userEmail: string = email;

  const byId = await admin
    .from('profiles')
    .select('id, email')
    .eq('steam_id_64', steamId64)
    .maybeSingle();

  if (byId.data) {
    userId = byId.data.id;
    userEmail = byId.data.email;
  } else {
    // 2. Buscar por email sintético (recovery de estado roto donde createUser
    //    funcionó pero el upsert con steam_id_64 nunca llegó).
    const byEmail = await admin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (byEmail.data) {
      userId = byEmail.data.id;
      userEmail = byEmail.data.email;
    } else {
      // 3. Crear user nuevo.
      const created = await admin.auth.admin.createUser({
        email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });

      if (created.error) {
        // El email puede existir en auth.users sin profile (race).
        // Buscar por email en auth.users via listUsers (max 1000, ok para esta escala).
        const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = list.data.users.find((u) => u.email === email);
        if (!existing) {
          return NextResponse.redirect(
            new URL(
              `/auth/login?steam_error=${encodeURIComponent(created.error.message)}`,
              url.origin,
            ),
          );
        }
        userId = existing.id;
      } else if (created.data.user) {
        userId = created.data.user.id;
      }
    }
  }

  if (!userId) {
    return NextResponse.redirect(
      new URL('/auth/login?steam_error=user_resolve_failed', url.origin),
    );
  }

  // Upsert profile con datos Steam (cubre casos donde trigger no corrió o steam fields faltaban).
  const { error: upsertErr } = await admin.from('profiles').upsert(
    {
      id: userId,
      email: userEmail,
      display_name: displayName,
      steam_id_64: steamId64,
      steam_persona: profile?.personaname ?? null,
      steam_avatar_url: profile?.avatarfull ?? null,
      mmr_estimate: mmr,
      mmr_cached_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (upsertErr) {
    return NextResponse.redirect(
      new URL(`/auth/login?steam_error=${encodeURIComponent(upsertErr.message)}`, url.origin),
    );
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
