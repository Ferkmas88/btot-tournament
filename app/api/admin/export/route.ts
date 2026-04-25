import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(values: unknown[]): string {
  return values.map(csvEscape).join(',');
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();

    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (teamsErr) throw new Error(teamsErr.message);

    const { data: members, error: memErr } = await supabase
      .from('team_members')
      .select('team_id, slot, nick, steam_id, contact, contact_type, self_mmr, confirmed_at');

    if (memErr) throw new Error(memErr.message);

    const membersByTeam = new Map<string, typeof members>();
    (members ?? []).forEach((m) => {
      const arr = membersByTeam.get(m.team_id) ?? [];
      arr.push(m);
      membersByTeam.set(m.team_id, arr);
    });

    const header = [
      'team_name',
      'captain_name',
      'captain_steam',
      'captain_contact',
      'contact_type',
      'province',
      'join_code',
      'status',
      'created_at',
      'player_2', 'player_3', 'player_4', 'player_5',
      'confirmed_count',
      'total_self_mmr',
      'p2_steam', 'p2_mmr', 'p2_contact',
      'p3_steam', 'p3_mmr', 'p3_contact',
      'p4_steam', 'p4_mmr', 'p4_contact',
      'p5_steam', 'p5_mmr', 'p5_contact',
      'utm_source', 'utm_campaign', 'referral_source',
    ];

    const rows: string[] = [rowToCsv(header)];

    for (const t of teams ?? []) {
      const ms = membersByTeam.get(t.id) ?? [];
      const bySlot = new Map<number, (typeof ms)[number]>();
      ms.forEach((m) => bySlot.set(m.slot, m));

      const slotData = (s: number) => {
        const m = bySlot.get(s);
        return [m?.steam_id ?? '', m?.self_mmr ?? '', m?.contact ?? ''];
      };

      const totalMmr = ms.reduce((acc, m) => acc + (m.self_mmr ?? 0), 0);

      rows.push(
        rowToCsv([
          t.team_name,
          t.captain_name,
          t.captain_steam,
          t.captain_contact,
          t.contact_type,
          t.province,
          t.join_code ?? '',
          t.status,
          t.created_at,
          t.player_2, t.player_3, t.player_4, t.player_5,
          ms.length,
          totalMmr || '',
          ...slotData(2),
          ...slotData(3),
          ...slotData(4),
          ...slotData(5),
          t.utm_source ?? '',
          t.utm_campaign ?? '',
          t.referral_source ?? '',
        ]),
      );
    }

    const csv = '﻿' + rows.join('\n');
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="btot-equipos-${date}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
