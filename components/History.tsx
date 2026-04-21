const MILESTONES: Array<{
  year: string;
  province: string;
  title: string;
  text: string;
  source?: { label: string; url: string };
}> = [
  {
    year: '1987',
    province: 'NACIONAL',
    title: 'Nace el Joven Club de Computación',
    text: 'El 8 de septiembre de 1987 se fundan los Joven Club de Computación y Electrónica. Para la mayoría de los cubanos de esa generación, fue el primer contacto con una PC. Décadas después, esas mismas PCs serían donde se jugaría Dota.',
    source: {
      label: 'Wikipedia · Joven Club',
      url: 'https://es.wikipedia.org/wiki/Joven_Club_de_Computaci%C3%B3n_y_Electr%C3%B3nica',
    },
  },
  {
    year: '2010–2019',
    province: 'LA HABANA',
    title: 'SNET — la red callejera',
    text: 'La Street Network (SNET) llegó a conectar a miles de habaneros por cables y antenas WiFi. Tenía su propio servidor de Dota 2 funcional y llenaba los cines Yara y Acapulco con LAN parties de cientos de personas. En 2019 el Estado la absorbió y prácticamente la prohibió.',
    source: {
      label: 'France 24 · SNET',
      url: 'https://www.france24.com/es/20190823-snet-la-red-informal-que-reemplaz%C3%B3-a-internet-en-cuba-tropieza-con-nuevas-leyes',
    },
  },
  {
    year: '2015',
    province: 'CAMAGÜEY',
    title: 'Nace el Proyecto Dota 2 Camagüey',
    text: 'Grupo local que empezó a organizar torneos provinciales y nacionales. Para 2017 ya llevaba 6 torneos provinciales y 4 nacionales, convirtiéndose en la columna vertebral del competitivo cubano.',
  },
  {
    year: 'Verano 2017',
    province: '12 PROVINCIAS',
    title: '7mo Torneo Nacional',
    text: '16 equipos de Matanzas, Pinar del Río, La Habana, Isla de la Juventud, Villa Clara, Sancti Spíritus, Mayabeque, Santiago de Cuba, Las Tunas, Holguín, Guantánamo y Ciego de Ávila. Primera vez que el Dota 2 cubano se vio nacional de verdad.',
  },
  {
    year: 'Agosto 2019',
    province: 'CIENFUEGOS',
    title: 'WTF Cienfuegos gana el 9no Torneo Nacional',
    text: 'En Camagüey, frente a 9 equipos de varias provincias, WTF Cienfuegos se corona campeón ganándole la final a La Habana. Roster histórico: Ramón Cruz, Roberto Morejón, Brian Sánchez, Daniel Araujo, Wilber Puentes y William Alfredo.',
    source: {
      label: '5 de Septiembre · WTF Cienfuegos',
      url: 'https://www.5septiembre.cu/wtf-cienfuegos-o-los-reyes-del-dota-2-en-cuba/',
    },
  },
  {
    year: '2-4 Nov 2023',
    province: 'CUBA · SANTIAGO DE CHILE',
    title: 'Cuba en los Panamericanos de eSports',
    text: 'Primeros Pan American eSports Championships de la historia. El equipo FEMENINO cubano terminó 4to (solo perdió ante Perú, que ganó el oro). El masculino, 6to. Bajo el auspicio de la ADEC. Coach femenino: Antonio Sevila Hidalgo.',
    source: {
      label: 'Árbol Invertido',
      url: 'https://www.arbolinvertido.com/sociedad/escuadra-cubana-de-dota-2-hace-historia-en-los-primeros-juegos-panamericanos-de-deportes',
    },
  },
  {
    year: '2025',
    province: 'MUMBAI',
    title: 'Global Esports Games',
    text: 'Cuba contra Argentina en las clasificatorias del Global Esports Games Mumbai 2025. La isla sigue apareciendo en el mapa internacional, aunque con infraestructura mínima.',
  },
];

export default function History() {
  return (
    <section id="historia" className="py-24 px-4 bg-ink-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="stamp-heading mb-4">Historia Verificada</div>
          <h2 className="font-display text-4xl md:text-6xl text-white mb-4">
            20 años de <span className="text-blood">Dota en Cuba</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Antes del 5v5 online había cybers clandestinos, redes callejeras hechas con cable UTP y
            torneos donde el ganador se llevaba un DVD y el respeto de su provincia. Esta es la
            historia — con fuentes.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 timeline-line -translate-x-1/2" />
          <div className="space-y-12">
            {MILESTONES.map((m, i) => (
              <div
                key={m.year + m.title}
                className={`relative flex items-start md:items-center ${
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } flex-row gap-6`}
              >
                <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-blood rounded-full -translate-x-1/2 mt-2 md:mt-0 breathe-border" />
                <div className="ml-12 md:ml-0 md:w-1/2 md:px-8">
                  <div className="bg-ink-800/80 border border-blood/30 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-display text-amber-gold text-xl tracking-widest">
                        {m.year}
                      </span>
                      <span className="font-mono text-[10px] text-white/50 tracking-[0.15em]">
                        {m.province}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl text-white mb-2">{m.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed mb-3">{m.text}</p>
                    {m.source && (
                      <a
                        href={m.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block font-mono text-[10px] text-amber-gold/70 hover:text-amber-gold tracking-widest border-t border-white/10 pt-2 mt-2"
                      >
                        FUENTE: {m.source.label} ↗
                      </a>
                    )}
                  </div>
                </div>
                <div className="hidden md:block md:w-1/2" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block border border-amber-gold/30 px-6 py-4 bg-ink-950/60 max-w-2xl">
            <p className="font-mono text-xs text-amber-gold tracking-[0.2em] mb-2">
              ¿TIENES UNA FOTO, UN CLIP, UNA ANÉCDOTA?
            </p>
            <p className="text-white/80 text-sm">
              Mandala al Discord. Si es de un torneo provincial o un LAN viejo, la agregamos a esta
              línea de tiempo con crédito. La historia se escribe entre todos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
