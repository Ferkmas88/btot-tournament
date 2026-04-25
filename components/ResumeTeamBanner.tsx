'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'papaque-team-code';

export default function ResumeTeamBanner() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCode(stored);
    } catch {
      /* ignore */
    }
  }, []);

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setCode(null);
  }

  if (!code) return null;

  return (
    <div className="max-w-2xl mx-auto mb-6 border border-amber-gold/40 bg-amber-gold/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex-1">
        <p className="font-mono text-[10px] tracking-[0.2em] text-amber-gold uppercase mb-1">
          Tenés un equipo activo
        </p>
        <p className="text-white/80 text-sm">
          Código <span className="font-mono text-amber-gold">{code}</span> — volvé al panel para ver
          quién se conectó.
        </p>
      </div>
      <div className="flex gap-2 self-stretch sm:self-auto">
        <Link href={`/equipo/${code}`} className="btn-primary text-xs">
          Ir al panel →
        </Link>
        <button
          type="button"
          onClick={clear}
          className="font-mono text-[10px] text-white/40 hover:text-white/70 px-2"
          title="Olvidar este equipo en este navegador"
        >
          Olvidar
        </button>
      </div>
    </div>
  );
}
