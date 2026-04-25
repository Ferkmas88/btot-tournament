import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase';
import { isValidJoinCode } from '@/lib/codes';

export const runtime = 'nodejs';

const schema = z.object({
  slot: z.coerce.number().int().min(2).max(5),
  nick: z.string().trim().min(1).max(60),
  steam_id: z.string().trim().min(2).max(80),
  contact: z.string().trim().min(0).max(40).optional().nullable(),
  contact_type: z.enum(['whatsapp', 'telegram']).optional().nullable(),
  self_mmr: z.coerce.number().int().min(0).max(15000).optional().nullable(),
});

export async function POST(request: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const upper = code.toUpperCase();

  if (!isValidJoinCode(upper)) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const supabase = getServiceClient();

    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id')
      .eq('join_code', upper)
      .maybeSingle();

    if (teamErr) {
      return NextResponse.json({ error: 'Error consultando equipo' }, { status: 500 });
    }
    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    const payload = {
      team_id: team.id,
      slot: parsed.data.slot,
      nick: parsed.data.nick,
      steam_id: parsed.data.steam_id,
      contact: parsed.data.contact || null,
      contact_type: parsed.data.contact_type || null,
      self_mmr: parsed.data.self_mmr ?? null,
    };

    const { error } = await supabase
      .from('team_members')
      .upsert(payload, { onConflict: 'team_id,slot' });

    if (error) {
      return NextResponse.json({ error: 'No pudimos guardar tu confirmación' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
