/**
 * Envío de emails via Resend API (HTTP directo, sin SDK — para no agregar
 * dependencia hasta que Resend confirme uso productivo).
 * Doc: https://resend.com/docs/api-reference/emails/send-email
 */
type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? 'noreply@papaque.online';
  if (!apiKey) {
    throw new Error('Falta RESEND_API_KEY. Ver README ## Setup Resend.');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { id?: string };
  return { id: json.id ?? '' };
}

export function paymentConfirmationEmail(opts: {
  captainName: string;
  teamName: string;
  tournamentName: string;
  amountUsd: number;
  joinCode: string;
  siteUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Confirmación inscripción · ${opts.tournamentName}`;
  const teamUrl = `${opts.siteUrl}/equipo/${encodeURIComponent(opts.joinCode)}`;
  const text = [
    `Hola ${opts.captainName},`,
    '',
    `Confirmamos tu inscripción al ${opts.tournamentName} con el equipo "${opts.teamName}".`,
    `Monto cobrado: USD ${opts.amountUsd.toFixed(2)}.`,
    '',
    `Link del equipo (compartilo con tus jugadores):`,
    teamUrl,
    '',
    `Si necesitás ayuda, respondé este mail.`,
    `— Papaque`,
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">
      <h1 style="font-size:20px;margin:0 0 8px;">Inscripción confirmada</h1>
      <p style="margin:0 0 16px;color:#555;">${opts.tournamentName}</p>
      <p>Hola <strong>${opts.captainName}</strong>,</p>
      <p>Recibimos tu pago de <strong>USD ${opts.amountUsd.toFixed(2)}</strong> para el equipo <strong>${opts.teamName}</strong>.</p>
      <p>Link del equipo (compartilo con tus jugadores):<br/>
        <a href="${teamUrl}" style="color:#d4a017;">${teamUrl}</a>
      </p>
      <p style="margin-top:24px;color:#888;font-size:13px;">Si necesitás ayuda, respondé este mail.</p>
      <p style="color:#888;font-size:13px;">— Papaque</p>
    </div>
  `.trim();

  return { subject, html, text };
}
