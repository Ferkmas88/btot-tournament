import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/csrf';
import { getCurrentOrganizer } from '@/lib/organizer';
import { getServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origin inválido' }, { status: 403 });
  }
  const organizer = await getCurrentOrganizer();
  if (!organizer) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceClient();

  // Verificar que el team pertenece a un torneo del organizer.
  const { data: team } = await supabase
    .from('teams')
    .select('id, tournament_id')
    .eq('id', id)
    .maybeSingle();
  if (!team) return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('organizer_id')
    .eq('id', team.tournament_id)
    .maybeSingle();
  if (!tournament || tournament.organizer_id !== organizer.id) {
    return NextResponse.json({ error: 'Sin permiso sobre este equipo' }, { status: 403 });
  }

  const { error } = await supabase
    .from('teams')
    .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
