import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { isValidJoinCode } from '@/lib/codes';

export const runtime = 'nodejs';

type SlotInfo = {
  slot: number;
  nick_tentative: string;
  confirmed: boolean;
  nick_final: string | null;
};

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const upper = code.toUpperCase();

  if (!isValidJoinCode(upper)) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
  }

  try {
    const supabase = getServiceClient();

    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id, team_name, captain_name, captain_steam, province, player_2, player_3, player_4, player_5')
      .eq('join_code', upper)
      .maybeSingle();

    if (teamErr) {
      return NextResponse.json({ error: 'Error consultando equipo' }, { status: 500 });
    }
    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    const { data: members, error: memErr } = await supabase
      .from('team_members')
      .select('slot, nick')
      .eq('team_id', team.id);

    if (memErr) {
      return NextResponse.json({ error: 'Error consultando miembros' }, { status: 500 });
    }

    const confirmedBySlot = new Map<number, string>();
    (members ?? []).forEach((m) => confirmedBySlot.set(m.slot, m.nick));

    const slots: SlotInfo[] = [2, 3, 4, 5].map((s) => {
      const tentative = (team as Record<string, string>)[`player_${s}`] ?? '';
      const final = confirmedBySlot.get(s) ?? null;
      return {
        slot: s,
        nick_tentative: tentative,
        confirmed: final !== null,
        nick_final: final,
      };
    });

    return NextResponse.json({
      ok: true,
      team: {
        team_name: team.team_name,
        captain_name: team.captain_name,
        captain_steam: team.captain_steam,
        province: team.province,
      },
      slots,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
