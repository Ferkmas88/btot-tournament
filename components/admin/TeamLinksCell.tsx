'use client';

import { useState } from 'react';

type Props = {
  teamName: string;
  joinCode: string | null;
  captainContact: string;
  contactType: string;
};

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

export default function TeamLinksCell({
  teamName,
  joinCode,
  captainContact,
  contactType,
}: Props) {
  const [copied, setCopied] = useState<'panel' | 'join' | null>(null);

  if (!joinCode) {
    return <span className="font-mono text-xs text-white/30">sin código</span>;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const panelUrl = `${origin}/equipo/${joinCode}`;
  const joinUrl = `${origin}/unirse/${joinCode}`;

  const phone = normalizePhone(captainContact);
  const message = `Hola ${teamName}, este es el link de tu equipo en el torneo Papaque. Acá ves quién ya se conectó y el link para mandar a tus jugadores: ${panelUrl}`;

  const waHref =
    contactType === 'whatsapp' && phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : null;

  const tgHref =
    contactType === 'telegram' && phone
      ? `https://t.me/+${phone}?text=${encodeURIComponent(message)}`
      : null;

  async function copy(value: string, kind: 'panel' | 'join') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <button
        type="button"
        onClick={() => copy(panelUrl, 'panel')}
        className="font-mono text-[10px] text-amber-gold hover:text-white text-left"
        title={panelUrl}
      >
        {copied === 'panel' ? '✓ Copiado' : 'Copiar panel capitán'}
      </button>
      <button
        type="button"
        onClick={() => copy(joinUrl, 'join')}
        className="font-mono text-[10px] text-white/60 hover:text-white text-left"
        title={joinUrl}
      >
        {copied === 'join' ? '✓ Copiado' : 'Copiar link jugadores'}
      </button>
      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener"
          className="font-mono text-[10px] text-emerald-400 hover:text-emerald-300"
        >
          WhatsApp →
        </a>
      )}
      {tgHref && (
        <a
          href={tgHref}
          target="_blank"
          rel="noopener"
          className="font-mono text-[10px] text-sky-400 hover:text-sky-300"
        >
          Telegram →
        </a>
      )}
    </div>
  );
}
