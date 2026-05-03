import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthed } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase';
import { generatePairs } from '@/lib/round-robin';

export const runtime = 'nodejs';

const generateSchema = z.object({ action: z.literal('generate') });
const setScoreSchema = z.object({
  action: z.literal('set_score'),
  match_id: z.string().uuid(),
  score_a: z.number().int().min(0).max(2),
  score_b: z.number().int().min(0).max(2),
});
const setStatusSchema = z.object({
  action: z.literal('set_status'),
  match_id: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'done']),
});
const resetSchema = z.object({ action: z.literal('reset') });
const schema = z.discriminatedUnion('action', [
  generateSchema,
  setScoreSchema,
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
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    if (parsed.data.action === 'generate') {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id')
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      const ids = (teams ?? []).map((t) => t.id as string);
      if (ids.length < 2) {
        return NextResponse.json(
          { error: 'Necesitás al menos 2 equipos inscritos' },
          { status: 400 },
        );
      }
      const pairs = generatePairs(ids);
      const rows = pairs.map((p) => ({ team_a_id: p.a, team_b_id: p.b }));
      const { error: insErr, data: inserted } = await supabase
        .from('round_robin_matches')
        .upsert(rows, { onConflict: 'team_a_id,team_b_id', ignoreDuplicates: true })
        .select('id');
      if (insErr) throw new Error(insErr.message);
      return NextResponse.json({ ok: true, generated: pairs.length, new_rows: inserted?.length ?? 0 });
    }

    if (parsed.data.action === 'set_score') {
      const { match_id, score_a, score_b } = parsed.data;
      // BO3: el primero a 2 gana. Validación.
      const valid = (score_a === 2 && score_b < 2) || (score_b === 2 && score_a < 2);
      if (!valid) {
        return NextResponse.json(
          { error: 'En BO3 el ganador debe llegar a 2 (válidos: 2-0, 2-1, 1-2, 0-2)' },
          { status: 400 },
        );
      }
      const { data: row, error: getErr } = await supabase
        .from('round_robin_matches')
        .select('team_a_id, team_b_id')
        .eq('id', match_id)
        .maybeSingle();
      if (getErr) throw new Error(getErr.message);
      if (!row) return NextResponse.json({ error: 'Match no existe' }, { status: 404 });

      const winner_id = score_a > score_b ? row.team_a_id : row.team_b_id;

      const { error: updErr } = await supabase
        .from('round_robin_matches')
        .update({
          score_a,
          score_b,
          winner_id,
          status: 'done',
          updated_at: new Date().toISOString(),
        })
        .eq('id', match_id);
      if (updErr) throw new Error(updErr.message);
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === 'set_status') {
      const { match_id, status } = parsed.data;
      const update: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status !== 'done') {
        update.score_a = 0;
        update.score_b = 0;
        update.winner_id = null;
      }
      const { error } = await supabase.from('round_robin_matches').update(update).eq('id', match_id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === 'reset') {
      const { error } = await supabase.from('round_robin_matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
