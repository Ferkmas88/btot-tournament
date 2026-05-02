'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  hasSteam: boolean;
  mmrEstimate: number | null;
  mmrSelfReported: number | null;
};

export default function ProfileMmrEditor({ hasSteam, mmrEstimate, mmrSelfReported }: Props) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [savingSelf, setSavingSelf] = useState(false);
  const [selfValue, setSelfValue] = useState<string>(mmrSelfReported?.toString() ?? '');
  const [msg, setMsg] = useState<string | null>(null);

  async function refreshMmr() {
    setRefreshing(true);
    setMsg(null);
    try {
      const res = await fetch('/api/profile/refresh-mmr', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setMsg(json.mmr_estimate ? `MMR actualizado: ${json.mmr_estimate}` : 'OpenDota no tiene tu MMR. Reportalo manualmente abajo.');
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setRefreshing(false);
    }
  }

  async function saveSelfMmr() {
    setSavingSelf(true);
    setMsg(null);
    try {
      const value = selfValue.trim() === '' ? null : Number.parseInt(selfValue, 10);
      const res = await fetch('/api/profile/self-mmr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mmr_self_reported: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setMsg('MMR self-reported guardado.');
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setSavingSelf(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="metal-tile p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-gold/80 mb-1">
            MMR auto (OpenDota)
          </div>
          <div className="font-display text-3xl text-white">
            {mmrEstimate ?? <span className="text-white/30">—</span>}
          </div>
        </div>
        <div className="metal-tile p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-gold/80 mb-1">
            MMR self-reported
          </div>
          <div className="font-display text-3xl text-white">
            {mmrSelfReported ?? <span className="text-white/30">—</span>}
          </div>
        </div>
      </div>

      {hasSteam && (
        <button
          type="button"
          onClick={refreshMmr}
          disabled={refreshing}
          className="btn-secondary text-sm"
        >
          {refreshing ? 'Consultando...' : 'Refrescar MMR desde OpenDota'}
        </button>
      )}

      <div className="border-t border-white/10 pt-4">
        <label className="label-text">MMR self-reported (si OpenDota no lo encuentra)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={15000}
            value={selfValue}
            onChange={(e) => setSelfValue(e.target.value)}
            placeholder="ej: 4200"
            className="input-field max-w-[200px]"
          />
          <button
            type="button"
            onClick={saveSelfMmr}
            disabled={savingSelf}
            className="btn-primary text-sm"
          >
            {savingSelf ? '...' : 'Guardar'}
          </button>
        </div>
      </div>

      {msg && (
        <p className="font-mono text-[11px] text-amber-gold border border-amber-gold/40 bg-amber-gold/10 p-2">
          {msg}
        </p>
      )}
    </div>
  );
}
