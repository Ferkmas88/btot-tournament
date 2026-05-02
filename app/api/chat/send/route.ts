import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { checkRate } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const schema = z.object({
  channel_type: z.enum(['global', 'team']),
  team_id: z.string().uuid().nullable().optional(),
  content: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { channel_type, content } = parsed.data;
  const team_id = channel_type === 'team' ? parsed.data.team_id ?? null : null;

  if (channel_type === 'team' && !team_id) {
    return NextResponse.json({ error: 'team_id requerido' }, { status: 400 });
  }

  // Rate limit: 10 mensajes / 60s por user.
  if (!checkRate(`chat:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Despacio. Esperá un momento.' }, { status: 429 });
  }

  const admin = getSupabaseAdmin();

  // Si es team channel, verificar que el user pertenece al equipo (member o captain).
  if (channel_type === 'team' && team_id) {
    const { data: member } = await admin
      .from('team_members')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .maybeSingle();

    let allowed = !!member;
    if (!allowed) {
      const { data: captain } = await admin
        .from('teams')
        .select('id')
        .eq('id', team_id)
        .eq('captain_user_id', user.id)
        .maybeSingle();
      allowed = !!captain;
    }

    if (!allowed) {
      return NextResponse.json({ error: 'No sos miembro de ese equipo' }, { status: 403 });
    }
  }

  const { data, error } = await admin
    .from('chat_messages')
    .insert({
      channel_type,
      team_id,
      user_id: user.id,
      content,
    })
    .select('id, channel_type, team_id, user_id, content, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: data });
}
