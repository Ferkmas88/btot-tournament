import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getServiceClient, PROVINCES } from '@/lib/supabase';
import { generateJoinCode } from '@/lib/codes';
import { getUser } from '@/lib/auth';
import { isSameOrigin } from '@/lib/csrf';
import { getActiveTournament } from '@/lib/tournaments';
import { createCheckout } from '@/lib/payments/provider';
import {
  isValidEmail,
  isValidName,
  isValidPhone,
  isValidTeamName,
  VALIDATION_MESSAGES,
} from '@/lib/validators';

export const runtime = 'nodejs';

const schema = z.object({
  team_name: z.string().refine(isValidTeamName, VALIDATION_MESSAGES.team_name),
  captain_name: z.string().refine(isValidName, VALIDATION_MESSAGES.name),
  captain_email: z.string().refine(isValidEmail, VALIDATION_MESSAGES.email),
  captain_contact: z.string().refine(isValidPhone, VALIDATION_MESSAGES.phone),
  contact_type: z.enum(['whatsapp', 'telegram']),
  province: z.enum(PROVINCES as unknown as [string, ...string[]]),
  referral_source: z.string().trim().max(40).optional().nullable(),
  utm_source: z.string().trim().max(40).optional().nullable(),
  utm_medium: z.string().trim().max(40).optional().nullable(),
  utm_campaign: z.string().trim().max(40).optional().nullable(),
});

const MAX_CODE_RETRIES = 5;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origin inválido' }, { status: 403 });
  }
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Tenés que estar logueado para crear un equipo. Entrá con Steam o email.' },
      { status: 401 },
    );
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

  const tournament = await getActiveTournament();
  if (!tournament) {
    return NextResponse.json(
      { error: 'No hay torneo abierto a inscripción. Suscribite para enterarte del próximo.' },
      { status: 409 },
    );
  }

  try {
    const supabase = getServiceClient();

    // Cupos: contar SOLO equipos del torneo activo, y solo los ya pagados/free
    // o pendientes recientes (los pending viejos sin pago se ignoran para no
    // bloquear cupos por carritos abandonados).
    const { count, error: countErr } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id)
      .in('payment_status', ['paid', 'free']);

    if (countErr) {
      return NextResponse.json({ error: 'No pudimos verificar cupos' }, { status: 500 });
    }

    if ((count ?? 0) >= tournament.max_teams) {
      return NextResponse.json(
        {
          error: `Cupos completos (${tournament.max_teams} equipos máx).`,
        },
        { status: 409 },
      );
    }

    // Block: si user ya tiene equipo confirmado EN ESTE TORNEO, no permitir otro.
    const { count: existingCount } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('captain_user_id', user.id)
      .eq('tournament_id', tournament.id)
      .in('payment_status', ['paid', 'free', 'pending']);

    if ((existingCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Ya creaste un equipo en este torneo.' },
        { status: 409 },
      );
    }

    const isPaid = Number(tournament.entry_fee_usd) > 0;
    const paymentRef = randomUUID();
    const baseInsert = {
      ...parsed.data,
      tournament_id: tournament.id,
      captain_user_id: user.id,
      payment_status: isPaid ? 'pending' : 'free',
      payment_amount_usd: isPaid ? tournament.entry_fee_usd : 0,
      payment_ref: isPaid ? paymentRef : null,
      payment_provider: isPaid ? 'lemonsqueezy' : null,
    } as const;

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      const join_code = generateJoinCode();
      const { data, error } = await supabase
        .from('teams')
        .insert({ ...baseInsert, join_code })
        .select('id, join_code')
        .single();

      if (!error && data) {
        if (isPaid) {
          try {
            const checkout = await createCheckout({
              tournament,
              teamId: data.id,
              paymentRef,
              captainEmail: parsed.data.captain_email,
              captainName: parsed.data.captain_name,
              teamName: parsed.data.team_name,
            });
            return NextResponse.json({
              ok: true,
              join_code: data.join_code,
              payment_required: true,
              checkout_url: checkout.url,
            });
          } catch (paymentErr) {
            const message =
              paymentErr instanceof Error ? paymentErr.message : 'error pagos';
            // El equipo quedó como pending. Idealmente el user puede reintentar
            // checkout desde /equipo/{code}, pero por ahora devolvemos el error.
            return NextResponse.json(
              { error: `Equipo creado pero falló el checkout: ${message}` },
              { status: 502 },
            );
          }
        }

        return NextResponse.json({
          ok: true,
          join_code: data.join_code,
          payment_required: false,
        });
      }

      if (error?.code === '23505') {
        const msg = (error.message ?? '').toLowerCase();
        if (msg.includes('team_name')) {
          return NextResponse.json(
            { error: 'Ya existe un equipo con ese nombre' },
            { status: 409 },
          );
        }
        // join_code colisión → reintento
        continue;
      }

      return NextResponse.json({ error: 'No pudimos guardar el registro' }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'No pudimos generar un código único, intentá de nuevo' },
      { status: 500 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
