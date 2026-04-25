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

    const header = [
      'team_name',
      'captain_name',
      'captain_email',
      'captain_contact',
      'contact_type',
      'province',
      'status',
      'created_at',
      'player_2_name', 'player_2_email',
      'player_3_name', 'player_3_email',
      'player_4_name', 'player_4_email',
      'player_5_name', 'player_5_email',
      'utm_source', 'utm_campaign', 'referral_source',
    ];

    const rows: string[] = [rowToCsv(header)];

    for (const t of teams ?? []) {
      rows.push(
        rowToCsv([
          t.team_name,
          t.captain_name,
          t.captain_email ?? '',
          t.captain_contact,
          t.contact_type,
          t.province,
          t.status,
          t.created_at,
          t.player_2_name ?? '', t.player_2_email ?? '',
          t.player_3_name ?? '', t.player_3_email ?? '',
          t.player_4_name ?? '', t.player_4_email ?? '',
          t.player_5_name ?? '', t.player_5_email ?? '',
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
