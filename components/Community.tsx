const CHANNELS: Array<{ name: string; tag: string; url: string; note: string }> = [
  {
    name: 'EL TYR',
    tag: 'CANAL OFICIAL',
    url: 'https://www.youtube.com/channel/UCWM5lN--VWYY_2Rx1LDJLpA',
    note: 'Canal cubano dedicado a dar presencia al Dota 2 de la isla en YouTube. Highlights, partidas, torneos locales.',
  },
  {
    name: 'Torneo Legado Fénix',
    tag: 'UNIVERSITARIO',
    url: 'https://www.youtube.com/watch?v=MGbfHShkSoI',
    note: 'Transmisiones del torneo universitario organizado en la Universidad de La Habana.',
  },
  {
    name: 'Empyrean Esport',
    tag: 'CLAN',
    url: 'https://www.youtube.com/watch?v=R5lggEj_upQ',
    note: 'Clan cubano que organiza torneos como el "Only Mid" con jugadores top de la escena.',
  },
  {
    name: 'Historia del Dota 2 en Cuba',
    tag: 'DOCUMENTAL',
    url: 'https://www.youtube.com/watch?v=mvRxpKRHLDA',
    note: 'Video recopilatorio sobre cómo se formó la escena cubana. Obligatorio para entender de dónde venimos.',
  },
];

const NATIONAL_TEAM_FEMALE = [
  { nick: 'Mortred', real: 'Claudia Sánchez Valdés' },
  { nick: 'IBG in your Face', real: 'Thalia Gálvez Vidal' },
  { nick: 'Lunar Jewel', real: 'Leadys Montenegro Hayes' },
  { nick: 'Mavis', real: 'Yaimelys Soto León' },
  { nick: 'Monshine', real: 'Arianna Janet González' },
  { nick: 'angie_rc', real: 'Angélica de la Caridad Reyes' },
];

const NATIONAL_TEAM_MALE = [
  { nick: 'Mr. Lens', real: 'Guillermo Yariel Álvarez' },
  { nick: 'KuroKo', real: 'José Javier Mirabal Esperón' },
  { nick: 'SKiLL-', real: 'Rubén Martínez Domínguez' },
  { nick: 'kmcdc', real: 'Manuel Alejandro Lago' },
  { nick: 'D3troiT', real: 'Ariel Nelson Vidal Cabrera' },
];

export default function Community() {
  return (
    <section id="comunidad" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="stamp-heading mb-4">La Comunidad</div>
          <h2 className="font-display text-4xl md:text-6xl text-white mb-4">
            Quiénes son <span className="text-blood">los nuestros</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Los cubanos que han llevado el Dota 2 a representar a Cuba en torneos oficiales, y los
            canales donde vive la escena día a día.
          </p>
        </div>

        <div className="image-frame blue-glow mb-16 p-2">
          <img
            src="/generated/team-archetypes.png"
            alt="Equipo de cinco heroes originales listo para competir"
            className="h-[280px] w-full object-cover md:h-[420px]"
          />
          <div className="flex flex-col justify-between gap-2 border-t border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 md:flex-row">
            <span>Carry · Mid · Offlane · Support · Hard Support</span>
            <span className="text-amber-gold/80">Cinco roles, una llamada</span>
          </div>
        </div>

        {/* Selección Nacional */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-ink-900/60 border border-blood/30 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-2xl text-white">Selección Femenina</h3>
              <span className="font-mono text-[10px] text-amber-gold tracking-[0.2em]">
                4TO · PANAMERICANOS 2023
              </span>
            </div>
            <ul className="space-y-2">
              {NATIONAL_TEAM_FEMALE.map((p) => (
                <li key={p.nick} className="flex justify-between items-baseline border-b border-white/5 pb-2">
                  <span className="font-display text-white text-lg">{p.nick}</span>
                  <span className="font-mono text-xs text-white/50">{p.real}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-[10px] text-white/40 tracking-[0.15em]">
              COACH · ANTONIO SEVILA HIDALGO
            </p>
          </div>

          <div className="bg-ink-900/60 border border-blood/30 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-2xl text-white">Selección Masculina</h3>
              <span className="font-mono text-[10px] text-amber-gold tracking-[0.2em]">
                6TO · PANAMERICANOS 2023
              </span>
            </div>
            <ul className="space-y-2">
              {NATIONAL_TEAM_MALE.map((p) => (
                <li key={p.nick} className="flex justify-between items-baseline border-b border-white/5 pb-2">
                  <span className="font-display text-white text-lg">{p.nick}</span>
                  <span className="font-mono text-xs text-white/50">{p.real}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-[10px] text-white/40 tracking-[0.15em]">
              AUSPICIADOS POR ADEC
            </p>
          </div>
        </div>

        {/* WTF Cienfuegos - equipo histórico */}
        <div className="bg-gradient-to-br from-blood/10 to-transparent border border-amber-gold/30 p-6 md:p-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <span className="font-mono text-[10px] text-amber-gold tracking-[0.2em]">
                CAMPEÓN NACIONAL · IX EDICIÓN · AGOSTO 2019
              </span>
              <h3 className="font-display text-3xl text-white mt-2">WTF Cienfuegos</h3>
            </div>
            <div className="font-mono text-xs text-white/60">
              9 equipos · Final vs La Habana · Sede: Camagüey
            </div>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {[
              'Ramón Cruz',
              'Roberto Morejón',
              'Brian Sánchez',
              'Daniel Araujo',
              'Wilber Puentes',
              'William Alfredo',
            ].map((p) => (
              <span key={p} className="px-3 py-1 border border-white/10 text-white/80">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Canales */}
        <div>
          <h3 className="font-display text-2xl text-white mb-6 text-center">
            Canales y clanes <span className="text-amber-gold">activos</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {CHANNELS.map((c) => (
              <a
                key={c.name}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-ink-900/60 border border-white/10 hover:border-blood/60 p-5 transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xl text-white group-hover:text-amber-gold transition">
                    {c.name}
                  </span>
                  <span className="font-mono text-[9px] text-amber-gold/80 tracking-[0.2em]">
                    {c.tag}
                  </span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{c.note}</p>
                <div className="mt-3 font-mono text-[10px] text-white/30 group-hover:text-amber-gold transition">
                  VER EN YOUTUBE →
                </div>
              </a>
            ))}
          </div>
          <p className="text-center mt-8 font-mono text-xs text-white/40 max-w-xl mx-auto">
            ¿Falta tu canal o tu clan? Mandanos el link en el Discord y lo sumamos.
          </p>
        </div>
      </div>
    </section>
  );
}
