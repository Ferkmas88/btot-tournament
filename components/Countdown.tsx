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

type Props = { isoDate: string };

export default function Countdown({ isoDate }: Props) {
  const target = new Date(isoDate);
  const [r, setR] = useState<Remaining>(() => diff(target));

  useEffect(() => {
    const t = setInterval(() => setR(diff(target)), 1000);
    return () => clearInterval(t);
  }, [isoDate]);

  if (r.done) {
    return (
      <div className="text-amber-gold font-display text-3xl md:text-5xl tracking-widest animate-flicker">
        EL TORNEO HA COMENZADO
      </div>
    );
  }

  const units: Array<[string, number]> = [
    ['DÍAS', r.days],
    ['HRS', r.hours],
    ['MIN', r.minutes],
    ['SEG', r.seconds],
  ];

  return (
    <div className="flex gap-3 md:gap-6 justify-center">
      {units.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col items-center min-w-[70px] md:min-w-[110px] px-3 md:px-5 py-3 md:py-5 bg-ink-900/80 border border-blood/40 breathe-border"
        >
          <div className="font-display text-4xl md:text-7xl text-white leading-none tabular-nums">
            {String(value).padStart(2, '0')}
          </div>
          <div className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-amber-gold mt-2">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
