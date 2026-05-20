'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type TeamRow = {
  id: string;
  team_name: string;
  captain_name: string;
  captain_email: string | null;
  captain_contact: string;
  province: string | null;
  payment_status: 'pending' | 'paid' | 'refunded' | 'free' | null;
  payment_method: 'card' | 'offline' | null;
  payment_amount_usd: number | null;
  created_at: string;
};

type Props = {
  tournamentSlug: string;
  currentStatus: 'draft' | 'open' | 'live' | 'closed';
  teams: TeamRow[];
};

const STATUS_OPTIONS: Array<'draft' | 'open' | 'live' | 'closed'> = [
  'draft',
  'open',
  'live',
  'closed',
];

export default function TournamentAdminPanel({ tournamentSlug, currentStatus, teams }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(next: typeof status) {
    if (next === status) return;
    setBusy('status');
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/tournaments/${tournamentSlug}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No pudimos cambiar el status');
      setStatus(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(null);
    }
  }

  async function markPaid(teamId: string) {
    setBusy(teamId);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/teams/${teamId}/mark-paid`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No pudimos marcar como pagado');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl text-white mb-3">Status del torneo</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy === 'status'}
              onClick={() => changeStatus(s)}
              className={`font-mono text-[11px] uppercase tracking-[0.18em] border px-3 py-2 ${
                status === s
                  ? 'border-amber-gold bg-amber-gold/15 text-amber-gold'
                  : 'border-white/15 text-white/55 hover:border-white/30'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] text-white/40 mt-2">
          draft = no público · open = inscripciones · live = en curso · closed = terminado
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl text-white mb-3">Equipos inscritos ({teams.length})</h2>

        {error && (
          <div className="border border-blood bg-blood/10 text-blood-light text-sm font-mono p-3 mb-3">
            {error}
          </div>
        )}

        {teams.length === 0 ? (
          <p className="text-white/50 text-sm">Todavía no hay inscripciones.</p>
        ) : (
          <div className="space-y-2">
            {teams.map((t) => {
              const offline = t.payment_method === 'offline';
              const pending = t.payment_status === 'pending';
              return (
                <div
                  key={t.id}
                  className="border border-white/10 bg-black/30 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display text-white">{t.team_name}</span>
                      <PaymentBadge status={t.payment_status} method={t.payment_method} />
                    </div>
                    <div className="font-mono text-[11px] text-white/55">
                      {t.captain_name} · {t.captain_contact}
                      {t.captain_email ? ` · ${t.captain_email}` : ''}
                      {t.province ? ` · ${t.province}` : ''}
                    </div>
                    {t.payment_amount_usd ? (
                      <div className="font-mono text-[11px] text-white/45 mt-0.5">
                        USD {Number(t.payment_amount_usd).toFixed(2)}
                        {offline ? ' · Pago offline (coordina WhatsApp)' : ' · Lemon Squeezy'}
                      </div>
                    ) : null}
                  </div>

                  {pending && (
                    <button
                      type="button"
                      onClick={() => markPaid(t.id)}
                      disabled={busy === t.id}
                      className="font-mono text-[10px] uppercase tracking-[0.18em] border border-emerald-400/40 bg-emerald-400/5 hover:bg-emerald-400/15 text-emerald-300 px-3 py-2"
                    >
                      {busy === t.id ? 'Marcando...' : '✓ Marcar pagado'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function PaymentBadge({
  status,
  method,
}: {
  status: TeamRow['payment_status'];
  method: TeamRow['payment_method'];
}) {
  if (status === 'paid') {
    return <Badge cls="border-emerald-400/50 text-emerald-300 bg-emerald-400/10">Pagado</Badge>;
  }
  if (status === 'pending' && method === 'offline') {
    return <Badge cls="border-amber-gold/50 text-amber-gold bg-amber-gold/10">Offline pendiente</Badge>;
  }
  if (status === 'pending') {
    return <Badge cls="border-amber-gold/50 text-amber-gold bg-amber-gold/10">Pendiente</Badge>;
  }
  if (status === 'refunded') {
    return <Badge cls="border-blood/60 text-blood-light bg-blood/15">Reembolsado</Badge>;
  }
  if (status === 'free') {
    return <Badge cls="border-white/20 text-white/55 bg-white/5">Free</Badge>;
  }
  return null;
}

function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
  return (
    <span className={`font-mono text-[9px] uppercase tracking-[0.18em] border px-2 py-0.5 ${cls}`}>
      {children}
    </span>
  );
}
