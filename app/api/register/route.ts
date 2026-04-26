import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient, PROVINCES } from '@/lib/supabase';
import { generateJoinCode } from '@/lib/codes';
import {
  isValidEmail,
  isValidName,
  isValidPhone,
  isValidTeamName,
  VALIDATION_MESSAGES,
} from '@/lib/validators';

export const runtime = 'nodejs';

const schema = z.object({
  team_name: z.string().refine(isValidTeamName, VALIDATION_MESSAGES.team_name),
  captain_name: z.string().refine(isValidName, VALIDATION_MESSAGES.name),
  captain_email: z.string().refine(isValidEmail, VALIDATION_MESSAGES.email),
  captain_contact: z.string().refine(isValidPhone, VALIDATION_MESSAGES.phone),
  contact_type: z.enum(['whatsapp', 'telegram']),
  province: z.enum(PROVINCES as unknown as [string, ...string[]]),
  referral_source: z.string().trim().max(40).optional().nullable(),
  utm_source: z.string().trim().max(40).optional().nullable(),
  utm_medium: z.string().trim().max(40).optional().nullable(),
  utm_campaign: z.string().trim().max(40).optional().nullable(),
});

const MAX_CODE_RETRIES = 5;
const MAX_TEAMS = Number.parseInt(process.env.MAX_TEAMS ?? '6', 10);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    const firstErr = Object.values(issues).find((v) => v && v.length)?.[0];
    return NextResponse.json(
      { error: firstErr || 'Datos inválidos', issues },
      { status: 400 },
    );
  }

  try {
    const supabase = getServiceClient();

    const { count, error: countErr } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true });

    if (countErr) {
      return NextResponse.json({ error: 'No pudimos verificar cupos' }, { status: 500 });
    }

    if ((count ?? 0) >= MAX_TEAMS) {
      return NextResponse.json(
        {
          error: `Cupos completos (${MAX_TEAMS} equipos máx). Si tu registro fue cancelado por error, escribinos al Discord.`,
        },
        { status: 409 },
      );
    }

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
        const msg = (error.message ?? '').toLowerCase();
        if (msg.includes('team_name')) {
          return NextResponse.json(
            { error: 'Ya existe un equipo con ese nombre' },
            { status: 409 },
          );
        }
        // join_code colisión → reintento
        continue;
      }

      return NextResponse.json({ error: 'No pudimos guardar el registro' }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'No pudimos generar un código único, intentá de nuevo' },
      { status: 500 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
