'use client';

import { useMemo, useState } from 'react';

export type SlotInfo = {
  slot: number;
  nick_tentative: string;
  confirmed: boolean;
  nick_final: string | null;
};

export type TeamSummary = {
  team_name: string;
  captain_name: string;
  captain_steam: string;
  province: string;
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Props = {
  code: string;
  team: TeamSummary;
  slots: SlotInfo[];
};

export default function JoinForm({ code, team: _team, slots: initialSlots }: Props) {
  const [slots, setSlots] = useState<SlotInfo[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(() => {
    const firstFree = initialSlots.find((s) => !s.confirmed);
    return firstFree ? firstFree.slot : null;
  });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [confirmedNick, setConfirmedNick] = useState<string | null>(null);

  const discord = process.env.NEXT_PUBLIC_DISCORD_INVITE ?? '#';
  const allFull = useMemo(() => slots.every((s) => s.confirmed), [slots]);

  const currentSlot = slots.find((s) => s.slot === selectedSlot) ?? null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Elegí cuál jugador eres');
      return;
    }
    setStatus('submitting');
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      slot: selectedSlot,
      nick: String(fd.get('nick') || '').trim(),
      steam_id: String(fd.get('steam_id') || '').trim(),
      contact: String(fd.get('contact') || '').trim() || null,
      contact_type: (fd.get('contact_type') as string) || null,
      self_mmr: fd.get('self_mmr') ? Number(fd.get('self_mmr')) : null,
    };

    try {
      const res = await fetch(`/api/team/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No pudimos confirmar');

      setSlots((prev) =>
        prev.map((s) =>
          s.slot === selectedSlot ? { ...s, confirmed: true, nick_final: payload.nick } : s,
        ),
      );
      setConfirmedNick(payload.nick);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  if (status === 'success') {
    return (
      <div className="border-2 border-amber-gold p-8 bg-ink-900/80 text-center">
        <div className="stamp-heading mb-5 border-amber-gold text-amber-gold">Confirmado</div>
        <h2 className="font-display text-3xl md:text-4xl text-white mb-3">
          Listo, <span className="text-amber-gold">{confirmedNick}</span>
        </h2>
        <p className="text-white/70 mb-6">
          Tu Steam quedó atado al equipo. Únete al Discord para la mesa de capitanes y los brackets.
        </p>
        <a href={discord} target="_blank" rel="noopener" className="btn-primary">
          Unirme al Discord →
        </a>
      </div>
    );
  }

  if (allFull) {
    return (
      <div className="border border-blood/50 p-8 bg-ink-900/60 text-center">
        <h2 className="font-display text-2xl text-white mb-3">Equipo completo</h2>
        <p className="text-white/70">Los 4 jugadores ya confirmaron. Si esto es un error, hablá con el capitán.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-ink-900/60 border border-blood/30 p-6 md:p-8 space-y-6">
      <div>
        <label className="label-text">¿Cuál jugador eres tú?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {slots.map((s) => {
            const disabled = s.confirmed;
            const active = selectedSlot === s.slot;
            return (
              <button
                key={s.slot}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedSlot(s.slot)}
                className={[
                  'text-left p-3 border transition font-mono text-sm',
                  disabled
                    ? 'border-white/10 bg-black/30 text-white/30 cursor-not-allowed'
                    : active
                    ? 'border-amber-gold bg-amber-gold/10 text-amber-gold'
                    : 'border-white/20 hover:border-white/50 text-white/80',
                ].join(' ')}
              >
                <div className="text-[10px] tracking-[0.2em] opacity-60 mb-1">JUGADOR {s.slot}</div>
                <div className="text-base">{s.confirmed ? s.nick_final : s.nick_tentative}</div>
                {s.confirmed && (
                  <div className="text-[10px] mt-1 text-emerald-400/80">✓ ya confirmó</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="label-text">Tu nick (corregilo si está mal)</label>
          <input
            name="nick"
            required
            defaultValue={currentSlot?.nick_tentative ?? ''}
            className="input-field"
          />
        </div>
        <div>
          <label className="label-text">Tu Steam ID o link de perfil</label>
          <input
            name="steam_id"
            required
            placeholder="steamcommunity.com/id/..."
            className="input-field"
          />
        </div>

        <div>
          <label className="label-text">MMR aproximado (opcional)</label>
          <input
            name="self_mmr"
            type="number"
            min={0}
            max={15000}
            placeholder="3500"
            className="input-field"
          />
        </div>

        <div>
          <label className="label-text">Tu contacto (opcional)</label>
          <div className="flex gap-2">
            <select name="contact_type" className="input-field max-w-[140px]" defaultValue="whatsapp">
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
            </select>
            <input name="contact" placeholder="+53 55555555" className="input-field" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={status === 'submitting' || !selectedSlot}
          className="btn-primary disabled:opacity-50"
        >
          {status === 'submitting' ? 'Confirmando...' : 'Confirmar mi participación'}
        </button>
        <p className="font-mono text-[11px] text-white/40 text-center max-w-md">
          Tu Steam ID se usa para validar tu identidad antes del torneo.
          El MMR es auto-reportado y puede ser pedido por la organización con captura.
        </p>
      </div>
    </form>
  );
}
