import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase';
import { isValidJoinCode } from '@/lib/codes';
import {
  isValidEmail,
  isValidName,
  VALIDATION_MESSAGES,
} from '@/lib/validators';

export const runtime = 'nodejs';

const schema = z.object({
  nick: z.string().refine(isValidName, VALIDATION_MESSAGES.name),
  email: z.string().refine(isValidEmail, VALIDATION_MESSAGES.email),
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
    const issues = parsed.error.flatten().fieldErrors;
    const firstErr = Object.values(issues).find((v) => v && v.length)?.[0];
    return NextResponse.json(
      { error: firstErr || 'Datos inválidos', issues },
      { status: 400 },
    );
  }

  try {
    const supabase = getServiceClient();

    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id, captain_email')
      .eq('join_code', upper)
      .maybeSingle();

    if (teamErr) {
      return NextResponse.json({ error: 'Error consultando equipo' }, { status: 500 });
    }
    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    const submittedEmail = parsed.data.email.trim().toLowerCase();

    const { data: members, error: memErr } = await supabase
      .from('team_members')
      .select('slot, email')
      .eq('team_id', team.id);

    if (memErr) {
      return NextResponse.json({ error: 'Error consultando miembros' }, { status: 500 });
    }

    const existing = members ?? [];

    // Chequeo unificado: email no debe coincidir ni con capitán ni con otro miembro.
    // Mensaje genérico para evitar account enumeration.
    const isCaptainEmail =
      !!team.captain_email && team.captain_email.trim().toLowerCase() === submittedEmail;
    const isMemberEmail = existing.some(
      (m) => m.email && m.email.trim().toLowerCase() === submittedEmail,
    );
    if (isCaptainEmail || isMemberEmail) {
      return NextResponse.json(
        { error: 'Ese email no se puede usar para este equipo. Usá uno distinto.' },
        { status: 400 },
      );
    }

    // asignar primer slot libre entre 2 y 5
    const usedSlots = new Set(existing.map((m) => m.slot));
    let assignedSlot: number | null = null;
    for (const s of [2, 3, 4, 5]) {
      if (!usedSlots.has(s)) {
        assignedSlot = s;
        break;
      }
    }

    if (assignedSlot === null) {
      return NextResponse.json(
        { error: 'El equipo ya tiene los 4 jugadores confirmados.' },
        { status: 409 },
      );
    }

    const { error: insertErr } = await supabase.from('team_members').insert({
      team_id: team.id,
      slot: assignedSlot,
      nick: parsed.data.nick.trim(),
      email: parsed.data.email.trim(),
    });

    if (insertErr) {
      return NextResponse.json({ error: 'No pudimos guardar tu confirmación' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, slot: assignedSlot });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
