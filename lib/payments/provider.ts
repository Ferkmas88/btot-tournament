import type { Tournament } from '@/lib/tournaments';

/**
 * Interfaz común para proveedores de pago. Cuando Fernando tenga LLC en US y
 * quiera migrar a Stripe (menores fees), basta cambiar la implementación
 * concreta detrás de esta interfaz — el resto del código no se entera.
 */
export type CheckoutInput = {
  tournament: Tournament;
  teamId: string;
  paymentRef: string;
  captainEmail: string;
  captainName: string;
  teamName: string;
};

export type CheckoutOutput = {
  url: string;
  provider: 'lemonsqueezy' | 'stripe';
};

export type WebhookVerifyInput = {
  body: string;
  signature: string | null;
};

export type WebhookEvent =
  | { type: 'order_paid'; paymentRef: string; orderId: string; teamId: string; amountUsd: number | null }
  | { type: 'order_refunded'; paymentRef: string; orderId: string; teamId: string }
  | { type: 'ignored'; reason: string };

export type PaymentProvider = {
  name: 'lemonsqueezy' | 'stripe';
  createCheckout(input: CheckoutInput): Promise<CheckoutOutput>;
  verifyAndParseWebhook(input: WebhookVerifyInput): Promise<WebhookEvent>;
};

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('./lemonsqueezy') as { lemonSqueezyProvider: PaymentProvider };
  cached = mod.lemonSqueezyProvider;
  return cached;
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutOutput> {
  return getPaymentProvider().createCheckout(input);
}

export async function verifyAndParseWebhook(input: WebhookVerifyInput): Promise<WebhookEvent> {
  return getPaymentProvider().verifyAndParseWebhook(input);
}
