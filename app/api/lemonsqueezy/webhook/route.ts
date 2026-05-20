import { NextResponse } from 'next/server';
import { verifyAndParseWebhook } from '@/lib/payments/provider';
import { getServiceClient } from '@/lib/supabase';
import { paymentConfirmationEmail, sendEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';
// LS firma el cuerpo crudo — no podemos parsear antes de validar firma.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get('x-signature');

  let event;
  try {
    event = await verifyAndParseWebhook({ body: raw, signature });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'verify error';
    // 401 sólo para firma inválida — devuelve detalle mínimo, no filtra config.
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  if (event.type === 'ignored') {
    return NextResponse.json({ ok: true, ignored: event.reason });
  }

  const supabase = getServiceClient();

  if (event.type === 'order_paid') {
    // Idempotencia: si ya esta paid con este payment_ref, no hacer nada.
    const { data: existing } = await supabase
      .from('teams')
      .select('id, payment_status, captain_email, captain_name, team_name, join_code, tournament_id')
      .eq('id', event.teamId)
      .eq('payment_ref', event.paymentRef)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'team/payment_ref no encontrado' }, { status: 404 });
    }

    if (existing.payment_status === 'paid') {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    const { error: updErr } = await supabase
      .from('teams')
      .update({
        payment_status: 'paid',
        payment_ref: event.orderId,
        payment_amount_usd: event.amountUsd,
        paid_at: new Date().toISOString(),
      })
      .eq('id', event.teamId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // Email de confirmación al capitán. Si falla, log pero no romper webhook
    // (LS reintenta si devolvemos 5xx — y el pago ya está confirmado en DB).
    try {
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('name')
        .eq('id', existing.tournament_id)
        .maybeSingle();
      const tournamentName = (tournament?.name as string | undefined) ?? 'Torneo Papaque';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://papaque.online';
      const email = paymentConfirmationEmail({
        captainName: existing.captain_name,
        teamName: existing.team_name,
        tournamentName,
        amountUsd: event.amountUsd ?? 0,
        joinCode: existing.join_code,
        siteUrl,
      });
      await sendEmail({ to: existing.captain_email, ...email });
    } catch (err) {
      console.error('[lemonsqueezy/webhook] email fail:', err);
    }

    return NextResponse.json({ ok: true });
  }

  if (event.type === 'order_refunded') {
    const { error } = await supabase
      .from('teams')
      .update({ payment_status: 'refunded' })
      .eq('id', event.teamId)
      .eq('payment_ref', event.orderId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
