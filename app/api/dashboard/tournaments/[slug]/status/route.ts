import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOrigin } from '@/lib/csrf';
import { getCurrentOrganizer } from '@/lib/organizer';
import { getServiceClient } from '@/lib/supabase';
import { invalidateTournamentCache } from '@/lib/tournaments';

export const runtime = 'nodejs';

const schema = z.object({
  status: z.enum(['draft', 'open', 'live', 'closed']),
});

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origin inválido' }, { status: 403 });
  }
  const organizer = await getCurrentOrganizer();
  if (!organizer) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('tournaments')
    .update({ status: parsed.data.status })
    .eq('slug', slug)
    .eq('organizer_id', organizer.id)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Torneo no encontrado o sin permiso' }, { status: 404 });

  invalidateTournamentCache();
  return NextResponse.json({ ok: true });
}
