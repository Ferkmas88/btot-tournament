import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient, PROVINCES } from '@/lib/supabase';
import {
  isValidEmail,
  isValidName,
  isValidPhone,
  isValidTeamName,
  VALIDATION_MESSAGES,
} from '@/lib/validators';

export const runtime = 'nodejs';

const nameField = (msg = VALIDATION_MESSAGES.name) =>
  z.string().refine(isValidName, msg);
const emailField = z.string().refine(isValidEmail, VALIDATION_MESSAGES.email);
const phoneField = z.string().refine(isValidPhone, VALIDATION_MESSAGES.phone);
const teamNameField = z.string().refine(isValidTeamName, VALIDATION_MESSAGES.team_name);

const schema = z.object({
  team_name: teamNameField,

  captain_name: nameField(),
  captain_email: emailField,
  captain_contact: phoneField,
  contact_type: z.enum(['whatsapp', 'telegram']),
  province: z.enum(PROVINCES as unknown as [string, ...string[]]),

  player_2_name: nameField(),
  player_2_email: emailField,
  player_3_name: nameField(),
  player_3_email: emailField,
  player_4_name: nameField(),
  player_4_email: emailField,
  player_5_name: nameField(),
  player_5_email: emailField,

  referral_source: z.string().trim().max(40).optional().nullable(),
  utm_source: z.string().trim().max(40).optional().nullable(),
  utm_medium: z.string().trim().max(40).optional().nullable(),
  utm_campaign: z.string().trim().max(40).optional().nullable(),
});

function emailsAreUnique(data: z.infer<typeof schema>): string | null {
  const emails = [
    data.captain_email,
    data.player_2_email,
    data.player_3_email,
    data.player_4_email,
    data.player_5_email,
  ].map((e) => e.trim().toLowerCase());

  const seen = new Set<string>();
  for (const e of emails) {
    if (seen.has(e)) return `El email ${e} está repetido en el equipo`;
    seen.add(e);
  }
  return null;
}

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

  const dupErr = emailsAreUnique(parsed.data);
  if (dupErr) {
    return NextResponse.json({ error: dupErr }, { status: 400 });
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
