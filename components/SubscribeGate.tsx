'use client';

import { useEffect, useState } from 'react';

const DEFAULT_STORAGE_KEY = 'papaque-subscribed-v1';

const CHANNELS = [
  {
    id: 'twitch' as const,
    name: 'Twitch',
    url: 'https://www.twitch.tv/piterchuang',
    handle: '@piterchuang',
    color: 'from-purple-500/30 to-purple-700/30',
    border: 'border-purple-400/40',
    text: 'text-purple-200',
  },
  {
    id: 'kick' as const,
    name: 'Kick',
    url: 'https://kick.com/piterchuang',
    handle: '@piterchuang',
    color: 'from-emerald-500/30 to-emerald-700/30',
    border: 'border-emerald-400/40',
    text: 'text-emerald-200',
  },
  {
    id: 'tiktok' as const,
    name: 'TikTok',
    url: 'https://www.tiktok.com/@pedroenriquecm',
    handle: '@pedroenriquecm',
    color: 'from-rose-500/30 to-cyan-500/20',
    border: 'border-rose-400/40',
    text: 'text-rose-200',
  },
];

type Channel = (typeof CHANNELS)[number]['id'];

type Props = { children: React.ReactNode; storageKey?: string };

export default function SubscribeGate({ children, storageKey }: Props) {
  const STORAGE_KEY = storageKey ?? DEFAULT_STORAGE_KEY;
  const [clicked, setClicked] = useState<Record<Channel, boolean>>({
    twitch: false,
    kick: false,
    tiktok: false,
  });
  const [done, setDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'yes') {
        setDone(true);
      } else if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setClicked((c) => ({ ...c, ...parsed }));
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  function markClicked(id: Channel) {
    setClicked((prev) => {
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const allClicked = clicked.twitch && clicked.kick && clicked.tiktok;

  function continuar() {
    try {
      localStorage.setItem(STORAGE_KEY, 'yes');
    } catch {
      /* ignore */
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!hydrated) return null;
  if (done) return <>{children}</>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center mb-8">
        <p className="font-mono text-[10px] tracking-[0.3em] text-amber-gold/80 mb-2">
          PAPAQUE · PASO 1 DE 3
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-white mb-3">
          Seguí los <span className="text-amber-gold">canales del torneo</span>
        </h2>
        <p className="text-white/65 text-sm max-w-md mx-auto">
          Es requisito para todos los jugadores del equipo. Click en cada plataforma, dale follow,
          y cuando termines volvé acá.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {CHANNELS.map((c) => (
          <a
            key={c.id}
            href={c.url}
            target="_blank"
            rel="noopener"
            onClick={() => markClicked(c.id)}
            className={`relative angled-panel p-5 transition group hover:scale-[1.02] ${
              clicked[c.id] ? `${c.border} bg-gradient-to-br ${c.color}` : 'border-white/10'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="font-display text-2xl text-white">{c.name}</div>
              {clicked[c.id] ? (
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 border border-emerald-400/40 px-2 py-0.5">
                  ✓ Visto
                </span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 border border-white/15 px-2 py-0.5">
                  Pendiente
                </span>
              )}
            </div>
            <div className={`font-mono text-sm ${c.text} mb-4 break-all`}>{c.handle}</div>
            <div className="font-mono text-[11px] tracking-wider text-white/60 group-hover:text-white">
              ABRIR Y SEGUIR ↗
            </div>
          </a>
        ))}
      </div>

      <div className="angled-panel p-5 mb-6">
        <p className="text-white/70 text-sm">
          <strong className="text-amber-gold">Verificación:</strong> tildar acá no nos confirma que
          seguiste, pero cuando se inscribe el equipo, vas a tener que mandar capturas con tu
          perfil siguiendo cada cuenta. El día del torneo verificamos contra la lista oficial de
          followers — si tu equipo no está, no juega.
        </p>
      </div>

      <button
        type="button"
        onClick={continuar}
        disabled={!allClicked}
        className="btn-primary w-full text-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {allClicked
          ? 'Listo, ya seguí los 3 canales →'
          : `Falta dar click en ${
              [
                !clicked.twitch && 'Twitch',
                !clicked.kick && 'Kick',
                !clicked.tiktok && 'TikTok',
              ]
                .filter(Boolean)
                .join(', ')
            }`}
      </button>
    </div>
  );
}
