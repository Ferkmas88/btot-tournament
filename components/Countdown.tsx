'use client';

import { useEffect, useState } from 'react';

type Remaining = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

function diff(target: Date): Remaining {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  return { days, hours, minutes, seconds, done: false };
}

type Props = { isoDate: string; compact?: boolean };

export default function Countdown({ isoDate, compact = false }: Props) {
  const [r, setR] = useState<Remaining | null>(null);

  useEffect(() => {
    const target = new Date(isoDate);
    setR(diff(target));
    const t = setInterval(() => setR(diff(target)), 1000);
    return () => clearInterval(t);
  }, [isoDate]);

  if (r?.done) {
    return (
      <div className="text-amber-gold font-display text-3xl md:text-5xl tracking-widest animate-flicker">
        EL TORNEO HA COMENZADO
      </div>
    );
  }

  const units: Array<[string, number | null]> = [
    ['DÍAS', r?.days ?? null],
    ['HRS', r?.hours ?? null],
    ['MIN', r?.minutes ?? null],
    ['SEG', r?.seconds ?? null],
  ];

  return (
    <div className={`flex justify-center ${compact ? 'gap-2' : 'gap-3 md:gap-6'}`}>
      {units.map(([label, value]) => (
        <div
          key={label}
          className={`flex flex-col items-center bg-ink-900/80 border border-blood/40 breathe-border ${
            compact ? 'min-w-[58px] px-2 py-3' : 'min-w-[70px] md:min-w-[110px] px-3 md:px-5 py-3 md:py-5'
          }`}
        >
          <div
            suppressHydrationWarning
            className={`font-display text-white leading-none tabular-nums ${
              compact ? 'text-3xl' : 'text-4xl md:text-7xl'
            }`}
          >
            {value === null ? '--' : String(value).padStart(2, '0')}
          </div>
          <div className={`font-mono tracking-[0.2em] text-amber-gold mt-2 ${compact ? 'text-[9px]' : 'text-[10px] md:text-xs'}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
