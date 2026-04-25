'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'papaque-rules-accepted-v1';

const SOCIAL_LINKS = {
  twitch: 'https://www.twitch.tv/piterchuang',
  kick: 'https://kick.com/piterchuang',
  tiktok: 'https://www.tiktok.com/@pedroenriquecm',
};

const RULES = [
  {
    n: 1,
    title: 'Suscripción a los canales',
    body: 'Cada jugador del equipo debe estar suscrito a Twitch, Kick y TikTok del torneo.',
    cta: true,
  },
  {
    n: 2,
    title: 'MMR combinado máximo 15000',
    body: 'La suma del MMR de los 5 jugadores no puede pasar de 15000. Esto mantiene el torneo parejo.',
  },
  {
    n: 3,
    title: 'Evidencia de cuenta y MMR',
    body: 'Cada jugador debe enviar foto de perfil de su cuenta original + captura con su MMR actual. Sirve para verificar identidad y calcular el cupo del equipo.',
  },
  {
    n: 4,
    title: 'Foto de busto',
    body: 'Una foto de busto de cada jugador, que queda registrada como parte del torneo (pósters, brackets, etc.).',
  },
  {
    n: 5,
    title: 'Las fotos las mandás después',
    body: 'Acá solo te inscribís. Las fotos de cuenta, MMR y busto las mandás por WhatsApp/Discord a la organización después de inscribirte.',
  },
];

type Props = { children: React.ReactNode };

export default function RulesGate({ children }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'yes') {
        setAccepted(true);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, 'yes');
    } catch {
      /* ignore */
    }
    setAccepted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!hydrated) {
    return null;
  }

  if (accepted) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center mb-8">
        <p className="font-mono text-[10px] tracking-[0.3em] text-amber-gold/80 mb-2">
          PAPAQUE · REGLAS DEL TORNEO
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-white mb-3">
          Antes de inscribirte, <span className="text-amber-gold">leé las reglas</span>
        </h2>
        <p className="text-white/60 text-sm max-w-md mx-auto">
          Si tu equipo no cumple alguna, no podemos confirmar la inscripción. Mejor sabelo ahora.
        </p>
      </div>

      <div className="angled-panel p-6 md:p-8 space-y-4">
        {RULES.map((r) => (
          <div key={r.n} className="border border-white/10 bg-ink-900/40 p-4 md:p-5">
            <div className="flex items-start gap-4">
              <div className="font-display text-3xl text-amber-gold leading-none flex-shrink-0">
                {String(r.n).padStart(2, '0')}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg text-white mb-1">{r.title}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{r.body}</p>
                {r.cta && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={SOCIAL_LINKS.twitch}
                      target="_blank"
                      rel="noopener"
                      className="font-mono text-[11px] tracking-[0.18em] uppercase border border-amber-gold/40 text-amber-gold px-3 py-1.5 hover:bg-amber-gold/10 transition"
                    >
                      Twitch ↗
                    </a>
                    <a
                      href={SOCIAL_LINKS.kick}
                      target="_blank"
                      rel="noopener"
                      className="font-mono text-[11px] tracking-[0.18em] uppercase border border-amber-gold/40 text-amber-gold px-3 py-1.5 hover:bg-amber-gold/10 transition"
                    >
                      Kick ↗
                    </a>
                    <a
                      href={SOCIAL_LINKS.tiktok}
                      target="_blank"
                      rel="noopener"
                      className="font-mono text-[11px] tracking-[0.18em] uppercase border border-amber-gold/40 text-amber-gold px-3 py-1.5 hover:bg-amber-gold/10 transition"
                    >
                      TikTok ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <label className="flex items-start gap-3 cursor-pointer pt-3 border-t border-white/10 mt-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-4 w-4 accent-amber-gold cursor-pointer"
          />
          <span className="text-white/80 text-sm leading-relaxed">
            <strong className="text-white">Confirmo</strong> que leí las 5 reglas, mi equipo va a
            cumplirlas, y entiendo que <strong>la organización puede rechazar la inscripción</strong>{' '}
            si no se cumple alguna.
          </span>
        </label>

        <button
          type="button"
          onClick={accept}
          disabled={!checked}
          className="btn-primary w-full text-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {checked ? 'Acepto, empezar inscripción →' : 'Tildá la casilla para continuar'}
        </button>
      </div>
    </div>
  );
}
