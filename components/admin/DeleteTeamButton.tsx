'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = { teamId: string; teamName: string };

export default function DeleteTeamButton({ teamId, teamName }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const ok = window.confirm(
      `Borrar equipo "${teamName}" y todos sus jugadores confirmados?\n\nEsto NO se puede deshacer.`,
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(`Error: ${json.error ?? 'no se pudo borrar'}`);
        setBusy(false);
        return;
      }
      router.refresh();
    } catch (e) {
      window.alert(`Error: ${e instanceof Error ? e.message : 'desconocido'}`);
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="font-mono text-[10px] uppercase tracking-wider text-blood-light hover:text-white border border-blood/40 px-2 py-1 hover:bg-blood/20 transition disabled:opacity-40"
    >
      {busy ? '...' : 'Borrar'}
    </button>
  );
}
