import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const LIMIT = 50;

type MessageRow = {
  id: string;
  channel_type: 'global' | 'team';
  team_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string;
  steam_persona: string | null;
  steam_avatar_url: string | null;
};

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const url = new URL(request.url);
  const ch = url.searchParams.get('ch') ?? 'global'; // 'global' | 'team-{uuid}'

  const admin = getSupabaseAdmin();
  let query = admin
    .from('chat_messages')
    .select('id, channel_type, team_id, user_id, content, created_at')
    .order('created_at', { ascending: false })
    .limit(LIMIT);

  if (ch === 'global') {
    query = query.eq('channel_type', 'global');
  } else if (ch.startsWith('team-')) {
    const teamId = ch.slice(5);
    if (!teamId) return NextResponse.json({ error: 'team_id inválido' }, { status: 400 });

    // Verificar membresía
    const { data: member } = await admin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();
    let allowed = !!member;
    if (!allowed) {
      const { data: captain } = await admin
        .from('teams')
        .select('id')
        .eq('id', teamId)
        .eq('captain_user_id', user.id)
        .maybeSingle();
      allowed = !!captain;
    }
    if (!allowed) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    query = query.eq('channel_type', 'team').eq('team_id', teamId);
  } else {
    return NextResponse.json({ error: 'Canal inválido' }, { status: 400 });
  }

  const { data: msgs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const messages = (msgs ?? []) as MessageRow[];

  // Fetch profiles for unique user_ids.
  const ids = Array.from(new Set(messages.map((m) => m.user_id)));
  const profilesMap = new Map<string, ProfileRow>();
  if (ids.length) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, display_name, email, steam_persona, steam_avatar_url')
      .in('id', ids);
    (profiles ?? []).forEach((p) => profilesMap.set(p.id, p as ProfileRow));
  }

  const enriched = messages.reverse().map((m) => {
    const p = profilesMap.get(m.user_id);
    return {
      ...m,
      author: {
        display_name: p?.steam_persona ?? p?.display_name ?? p?.email ?? 'anónimo',
        avatar_url: p?.steam_avatar_url ?? null,
      },
    };
  });

  return NextResponse.json({ messages: enriched });
}
