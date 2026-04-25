import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthed } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const SLOT = z.enum(['semi1', 'semi2', 'final']);

const setMatchTeamsSchema = z.object({
  action: z.literal('set_teams'),
  slot: SLOT,
  team_a_id: z.string().uuid().nullable(),
  team_b_id: z.string().uuid().nullable(),
});

const setWinnerSchema = z.object({
  action: z.literal('set_winner'),
  slot: SLOT,
  winner_id: z.string().uuid().nullable(),
});

const setStatusSchema = z.object({
  action: z.literal('set_status'),
  slot: SLOT,
  status: z.enum(['pending', 'in_progress', 'done']),
});

const resetSchema = z.object({
  action: z.literal('reset'),
});

const schema = z.discriminatedUnion('action', [
  setMatchTeamsSchema,
  setWinnerSchema,
  setStatusSchema,
  resetSchema,
]);

export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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

  const supabase = getServiceClient();

  try {
    if (parsed.data.action === 'set_teams') {
      const { slot, team_a_id, team_b_id } = parsed.data;
      const { error } = await supabase
        .from('matches')
        .update({
          team_a_id,
          team_b_id,
          updated_at: new Date().toISOString(),
        })
        .eq('slot', slot);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === 'set_winner') {
      const { slot, winner_id } = parsed.data;

      const update: Record<string, unknown> = {
        winner_id,
        status: winner_id ? 'done' : 'pending',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('matches').update(update).eq('slot', slot);
      if (error) throw new Error(error.message);

      // Auto-promote winner to final slot
      if (winner_id && (slot === 'semi1' || slot === 'semi2')) {
        const finalSlot = slot === 'semi1' ? 'team_a_id' : 'team_b_id';
        const { error: e2 } = await supabase
          .from('matches')
          .update({ [finalSlot]: winner_id, updated_at: new Date().toISOString() })
          .eq('slot', 'final');
        if (e2) throw new Error(e2.message);
      }

      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === 'set_status') {
      const { slot, status } = parsed.data;
      const { error } = await supabase
        .from('matches')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('slot', slot);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === 'reset') {
      const { error } = await supabase
        .from('matches')
        .update({
          team_a_id: null,
          team_b_id: null,
          winner_id: null,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .in('slot', ['semi1', 'semi2', 'final']);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
