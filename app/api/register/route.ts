import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient, PROVINCES } from '@/lib/supabase';

export const runtime = 'nodejs';

const schema = z.object({
  team_name: z.string().trim().min(2).max(60),

  captain_name: z.string().trim().min(2).max(80),
  captain_email: z.string().trim().email().max(120),
  captain_contact: z.string().trim().min(6).max(40),
  contact_type: z.enum(['whatsapp', 'telegram']),
  province: z.enum(PROVINCES as unknown as [string, ...string[]]),

  player_2_name: z.string().trim().min(2).max(80),
  player_2_email: z.string().trim().email().max(120),
  player_3_name: z.string().trim().min(2).max(80),
  player_3_email: z.string().trim().email().max(120),
  player_4_name: z.string().trim().min(2).max(80),
  player_4_email: z.string().trim().email().max(120),
  player_5_name: z.string().trim().min(2).max(80),
  player_5_email: z.string().trim().email().max(120),

  referral_source: z.string().trim().max(40).optional().nullable(),
  utm_source: z.string().trim().max(40).optional().nullable(),
  utm_medium: z.string().trim().max(40).optional().nullable(),
  utm_campaign: z.string().trim().max(40).optional().nullable(),
});

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
    const { error } = await supabase.from('teams').insert(parsed.data);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un equipo con ese nombre' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: 'No pudimos guardar el registro' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
