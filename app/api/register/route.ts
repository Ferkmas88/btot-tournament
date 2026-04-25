import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient, PROVINCES } from '@/lib/supabase';
import { generateJoinCode } from '@/lib/codes';

export const runtime = 'nodejs';

const schema = z.object({
  team_name: z.string().trim().min(2).max(60),
  captain_name: z.string().trim().min(2).max(80),
  captain_steam: z.string().trim().min(2).max(60),
  captain_contact: z.string().trim().min(6).max(40),
  contact_type: z.enum(['whatsapp', 'telegram']),
  province: z.enum(PROVINCES as unknown as [string, ...string[]]),
  player_2: z.string().trim().min(1).max(60),
  player_3: z.string().trim().min(1).max(60),
  player_4: z.string().trim().min(1).max(60),
  player_5: z.string().trim().min(1).max(60),
  referral_source: z.string().trim().max(40).optional().nullable(),
  utm_source: z.string().trim().max(40).optional().nullable(),
  utm_medium: z.string().trim().max(40).optional().nullable(),
  utm_campaign: z.string().trim().max(40).optional().nullable(),
});

const MAX_CODE_RETRIES = 5;

export async function POST(request: Request) {
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

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      const join_code = generateJoinCode();
      const { data, error } = await supabase
        .from('teams')
        .insert({ ...parsed.data, join_code })
        .select('id, join_code')
        .single();

      if (!error && data) {
        return NextResponse.json({ ok: true, join_code: data.join_code });
      }

      if (error?.code === '23505') {
        // Conflict on team_name → no reintento, error definitivo.
        const msg = (error.message ?? '').toLowerCase();
        if (msg.includes('team_name')) {
          return NextResponse.json(
            { error: 'Ya existe un equipo con ese nombre' },
            { status: 409 },
          );
        }
        // Conflict on join_code → reintento con otro code.
        continue;
      }

      // Otro error → fallar.
      return NextResponse.json({ error: 'No pudimos guardar el registro' }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'No pudimos generar un código único, intenta de nuevo' },
      { status: 500 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
