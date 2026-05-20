import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  CheckoutInput,
  CheckoutOutput,
  PaymentProvider,
  WebhookEvent,
  WebhookVerifyInput,
} from './provider';

const LS_API = 'https://api.lemonsqueezy.com/v1';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Falta env ${name}. Ver README ## Setup Lemon Squeezy.`,
    );
  }
  return v;
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

/**
 * Crea checkout hosted en Lemon Squeezy y devuelve la URL.
 * https://docs.lemonsqueezy.com/api/checkouts/create-checkout
 */
async function createCheckout(input: CheckoutInput): Promise<CheckoutOutput> {
  const apiKey = requireEnv('LEMONSQUEEZY_API_KEY');
  const storeId = requireEnv('LEMONSQUEEZY_STORE_ID');
  const variantId = requireEnv('LEMONSQUEEZY_VARIANT_ID_TOURNAMENT_ENTRY');

  // LS espera precio en cents.
  const priceCents = Math.round(Number(input.tournament.entry_fee_usd) * 100);

  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_options: { embed: false },
        checkout_data: {
          email: input.captainEmail,
          name: input.captainName,
          custom: {
            team_id: input.teamId,
            tournament_id: input.tournament.id,
            tournament_slug: input.tournament.slug,
            payment_ref: input.paymentRef,
            team_name: input.teamName,
          },
        },
        product_options: {
          name: `Inscripción ${input.tournament.name}`,
          description: `Equipo: ${input.teamName}`,
          redirect_url: `${siteUrl()}/inscribirse/exito?ref=${encodeURIComponent(input.paymentRef)}`,
          receipt_button_text: 'Volver a Papaque',
          receipt_link_url: siteUrl(),
        },
        custom_price: priceCents,
      },
      relationships: {
        store: { data: { type: 'stores', id: storeId } },
        variant: { data: { type: 'variants', id: variantId } },
      },
    },
  };

  const res = await fetch(`${LS_API}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lemon Squeezy checkout falló (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { data?: { attributes?: { url?: string } } };
  const url = json.data?.attributes?.url;
  if (!url) throw new Error('Respuesta LS sin URL de checkout');
  return { url, provider: 'lemonsqueezy' };
}

/**
 * Valida HMAC SHA-256 del webhook y parsea evento.
 * https://docs.lemonsqueezy.com/api/webhooks
 */
async function verifyAndParseWebhook(input: WebhookVerifyInput): Promise<WebhookEvent> {
  const secret = requireEnv('LEMONSQUEEZY_WEBHOOK_SECRET');
  if (!input.signature) throw new Error('Falta header X-Signature');

  const expected = createHmac('sha256', secret).update(input.body).digest('hex');
  const sigBuf = Buffer.from(input.signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Firma webhook inválida');
  }

  type LSBody = {
    meta?: {
      event_name?: string;
      custom_data?: Record<string, string>;
    };
    data?: {
      id?: string;
      attributes?: {
        status?: string;
        refunded?: boolean;
        total?: number; // cents
      };
    };
  };

  let body: LSBody;
  try {
    body = JSON.parse(input.body);
  } catch {
    throw new Error('Body webhook no es JSON');
  }

  const eventName = body.meta?.event_name ?? '';
  const orderId = body.data?.id ?? '';
  const custom = body.meta?.custom_data ?? {};
  const paymentRef = custom.payment_ref ?? '';
  const teamId = custom.team_id ?? '';

  if (!paymentRef || !teamId) {
    return { type: 'ignored', reason: 'sin custom_data.payment_ref / team_id' };
  }

  const totalCents = body.data?.attributes?.total ?? null;
  const amountUsd = totalCents !== null ? totalCents / 100 : null;

  if (eventName === 'order_created') {
    if (body.data?.attributes?.status === 'paid') {
      return { type: 'order_paid', orderId, paymentRef, teamId, amountUsd };
    }
    return { type: 'ignored', reason: `order_created status=${body.data?.attributes?.status}` };
  }

  if (eventName === 'order_refunded' || body.data?.attributes?.refunded) {
    return { type: 'order_refunded', orderId, paymentRef, teamId };
  }

  return { type: 'ignored', reason: `event=${eventName}` };
}

export const lemonSqueezyProvider: PaymentProvider = {
  name: 'lemonsqueezy',
  createCheckout,
  verifyAndParseWebhook,
};
