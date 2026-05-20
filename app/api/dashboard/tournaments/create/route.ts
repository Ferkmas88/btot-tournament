import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOrigin } from '@/lib/csrf';
import { getCurrentOrganizer } from '@/lib/organizer';
import { getServiceClient } from '@/lib/supabase';
import { invalidateTournamentCache } from '@/lib/tournaments';

export const runtime = 'nodejs';

const FORMATS = ['single_elim', 'double_elim', 'round_robin', 'groups_playoffs'] as const;
const STATUSES = ['draft', 'open', 'live', 'closed'] as const;
const PAYMENT_METHODS = ['card', 'whatsapp_alt'] as const;

const schema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug solo lowercase, números y guiones'),
  description: z.string().trim().max(500).nullable().optional(),
  game: z.string().trim().min(2).max(40),
  format: z.enum(FORMATS),
  max_teams: z.number().int().min(2).max(256),
  team_size: z.number().int().min(1).max(11),
  coach_required: z.boolean(),
  substitutes_allowed: z.number().int().min(0).max(10),
  mmr_min: z.number().int().nullable().optional(),
  mmr_max_per_team: z.number().int().nullable().optional(),
  rank_min: z.string().trim().max(40).nullable().optional(),
  required_immortal_per_team: z.number().int().min(0).max(11),
  entry_fee_per_player_usd: z.number().min(0).max(10000),
  entry_fee_per_team_usd: z.number().min(0).max(100000),
  payment_methods: z.array(z.enum(PAYMENT_METHODS)).min(1),
  prize_pool_usd: z.number().min(0).max(1_000_000),
  prize_distribution: z.record(z.string(), z.number()).nullable().optional(),
  starts_at: z.string().nullable().optional(),
  registration_closes_at: z.string().nullable().optional(),
  schedule_notes: z.string().trim().max(2000).nullable().optional(),
  servers_allowed: z.array(z.string().trim().max(40)).max(20),
  anti_cheat_rules: z.string().trim().max(5000).nullable().optional(),
  refund_policy_days: z.number().int().min(0).max(365),
  status: z.enum(STATUSES),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origin inválido' }, { status: 403 });
  }
  const organizer = await getCurrentOrganizer();
  if (!organizer) {
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
    const first = parsed.error.errors[0];
    return NextResponse.json(
      { error: first?.message ?? 'Datos inválidos', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  // Slug único.
  const { data: existing } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe un torneo con ese slug. Elegí otro.' },
      { status: 409 },
    );
  }

  const insertPayload = {
    organizer_id: organizer.id,
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    game: parsed.data.game,
    format: parsed.data.format,
    max_teams: parsed.data.max_teams,
    team_size: parsed.data.team_size,
    coach_required: parsed.data.coach_required,
    substitutes_allowed: parsed.data.substitutes_allowed,
    mmr_min: parsed.data.mmr_min ?? null,
    mmr_max_per_team: parsed.data.mmr_max_per_team ?? null,
    rank_min: parsed.data.rank_min ?? null,
    required_immortal_per_team: parsed.data.required_immortal_per_team,
    entry_fee_per_player_usd: parsed.data.entry_fee_per_player_usd,
    entry_fee_per_team_usd: parsed.data.entry_fee_per_team_usd,
    payment_methods: parsed.data.payment_methods,
    prize_pool_usd: parsed.data.prize_pool_usd,
    prize_distribution: parsed.data.prize_distribution ?? null,
    starts_at: parsed.data.starts_at || null,
    registration_closes_at: parsed.data.registration_closes_at || null,
    schedule_notes: parsed.data.schedule_notes ?? null,
    servers_allowed: parsed.data.servers_allowed,
    anti_cheat_rules: parsed.data.anti_cheat_rules ?? null,
    refund_policy_days: parsed.data.refund_policy_days,
    status: parsed.data.status,
  };

  const { data, error } = await supabase
    .from('tournaments')
    .insert(insertPayload)
    .select('id, slug')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateTournamentCache();
  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}
