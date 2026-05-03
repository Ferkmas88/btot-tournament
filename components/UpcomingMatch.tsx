// Hardcoded por ahora. Cambiar TEAM_A / TEAM_B cuando termine el match.
// TODO: cuando exista logica de scheduling, leer del round_robin_matches
// el primer match con status='pending'.

const TEAM_A = 'SEGUIDORES DE ALBITO';
const TEAM_B = 'LOS CHURRI CHURRI';
const TWITCH_URL = 'https://twitch.tv/piterchuang';

export default function UpcomingMatch() {
  return (
    <section className="px-4 py-8">
      <div className="max-w-5xl mx-auto border border-amber-gold/50 bg-amber-gold/5 p-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.95)] animate-pulse" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400 uppercase">
            Próxima partida
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="font-display text-2xl md:text-3xl text-white">{TEAM_A}</div>
          <div className="font-mono text-amber-gold">vs</div>
          <div className="font-display text-2xl md:text-3xl text-white">{TEAM_B}</div>
        </div>
        <a
          href={TWITCH_URL}
          target="_blank"
          rel="noopener"
          className="inline-block mt-4 font-mono text-xs uppercase tracking-wider text-amber-gold border border-amber-gold/50 px-4 py-2 hover:bg-amber-gold/15 transition"
        >
          Ver en vivo en Twitch →
        </a>
      </div>
    </section>
  );
}
