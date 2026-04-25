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
      .select('team_id, slot, nick, email, confirmed_at');
    if (memErr) throw new Error(memErr.message);

    type MemberLite = {
      team_id: string;
      slot: number;
      nick: string;
      email: string | null;
      confirmed_at: string;
    };
    const membersByTeam = new Map<string, MemberLite[]>();
    (members ?? []).forEach((m) => {
      const arr = membersByTeam.get(m.team_id) ?? [];
      arr.push(m as MemberLite);
      membersByTeam.set(m.team_id, arr);
    });

    const header = [
      'team_name',
      'captain_name',
      'captain_email',
      'captain_contact',
      'contact_type',
      'province',
      'join_code',
      'status',
      'created_at',
      'confirmed_count',
      'p2_name', 'p2_email', 'p2_confirmed_at',
      'p3_name', 'p3_email', 'p3_confirmed_at',
      'p4_name', 'p4_email', 'p4_confirmed_at',
      'p5_name', 'p5_email', 'p5_confirmed_at',
      'utm_source', 'utm_campaign', 'referral_source',
    ];

    const rows: string[] = [rowToCsv(header)];

    for (const t of teams ?? []) {
      const ms = membersByTeam.get(t.id) ?? [];
      const bySlot = new Map<number, MemberLite>();
      ms.forEach((m) => bySlot.set(m.slot, m));

      const slotData = (s: number) => {
        const m = bySlot.get(s);
        return [m?.nick ?? '', m?.email ?? '', m?.confirmed_at ?? ''];
      };

      rows.push(
        rowToCsv([
          t.team_name,
          t.captain_name,
          t.captain_email ?? '',
          t.captain_contact,
          t.contact_type,
          t.province,
          t.join_code ?? '',
          t.status,
          t.created_at,
          ms.length,
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
        'Content-Disposition': `attachment; filename="papaque-equipos-${date}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
