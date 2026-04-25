import Countdown from './Countdown';

type Props = { tournamentDate: string };

const menu = [
  ['Registro', '#registro'],
  ['Formato', '#formato'],
  ['Premio', '#premio'],
  ['Historia', '#historia'],
  ['Comunidad', '#comunidad'],
];

export default function Hero({ tournamentDate }: Props) {
  return (
    <section className="relative min-h-[94vh] overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-65"
        style={{ backgroundImage: "url('/generated/hero-lobby.png')" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(7,22,42,0.08),rgba(5,6,10,0.82)_62%,#05060a_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-ink-950" />

      <div className="relative z-10 mx-auto grid min-h-[calc(94vh-4rem)] max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[230px_1fr_330px]">
        <aside className="angled-panel hidden self-stretch p-4 lg:block">
          <div className="mb-8 border-b border-white/10 pb-5">
            <div className="font-display text-3xl text-white">PAPAQUE</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-gold">
              Cuba Lobby
            </div>
          </div>
          <nav className="space-y-1">
            {menu.map(([label, href], index) => (
              <a key={label} href={href} className="menu-link">
                <span>{label}</span>
                <span className="text-white/25">0{index + 1}</span>
              </a>
            ))}
          </nav>
          <div className="mt-8 border-t border-white/10 pt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              Estado
            </div>
            <div className="metal-tile mt-3 p-4">
              <div className="font-display text-2xl text-amber-gold">Abierto</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                16 equipos max
              </div>
            </div>
          </div>
        </aside>

        <div className="flex flex-col justify-end pb-8 pt-20 md:pb-12">
          <div className="mb-5 flex flex-wrap justify-center gap-2 lg:hidden">
            {menu.slice(0, 4).map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="border border-white/10 bg-black/35 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="max-w-4xl">
            <div className="stamp-heading mb-5">Torneo online · 2 de mayo</div>
            <h1 className="font-display text-7xl font-bold leading-[0.86] tracking-tight text-white md:text-[10rem]">
              <span className="block">PAPA</span>
              <span className="block shine-text">QUE</span>
            </h1>

            <p className="mt-5 font-mono text-sm tracking-[0.28em] text-amber-gold md:text-base">
              DOTA 2 · 5V5 · ONLINE · CUBA
            </p>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/76 md:text-xl">
              Un lobby cubano para equipos que quieren jugar serio, con estetica de arena oscura,
              bracket vivo y la energia de los LAN de barrio llevada al online.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="/inscribirse" className="btn-primary">
                Inscribir mi equipo
              </a>
              <a href="#formato" className="btn-secondary">
                Ver formato
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              <Stat label="Modo" value="5v5" />
              <Stat label="Cupo" value="16" />
              <Stat label="Costo" value="$0" />
            </div>
          </div>
        </div>

        <aside className="angled-panel self-end p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Proxima partida
              </div>
              <div className="font-display text-2xl text-white">Cuenta regresiva</div>
            </div>
            <div className="h-2 w-2 bg-blood shadow-[0_0_18px_rgba(194,63,50,0.95)]" />
          </div>
          <Countdown isoDate={tournamentDate} compact />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Mini label="Premio" value="G502 HERO" />
            <Mini label="Cierre" value="1 Mayo" />
          </div>
          <a
            href="#premio"
            className="mt-5 block text-center font-mono text-xs uppercase tracking-[0.2em] text-amber-gold transition hover:text-white"
          >
            Ver premio →
          </a>
        </aside>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metal-tile blue-glow p-4">
      <div className="font-display text-3xl text-white">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-gold/80">
        {label}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="metal-tile p-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="mt-1 font-display text-xl text-white">{value}</div>
    </div>
  );
}
