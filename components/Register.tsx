import Link from 'next/link';

export default function Register() {
  return (
    <section id="registro" className="relative overflow-hidden px-4 py-24">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
        style={{ backgroundImage: "url('/generated/hero-cybercafe.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/88 to-ink-950" />
      <div className="relative mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <div className="stamp-heading mb-4">Inscripción</div>
          <h2 className="font-display text-4xl md:text-6xl text-white mb-4">
            Mete tu equipo al <span className="text-blood">torneo</span>
          </h2>
          <p className="font-mono text-sm text-amber-gold tracking-[0.2em]">
            GRATIS · 16 EQUIPOS MAX · CIERRE 1 DE MAYO 23:59
          </p>
        </div>

        <div className="angled-panel p-8 md:p-10 text-center">
          <p className="text-white/75 text-base md:text-lg leading-relaxed mb-3">
            Inscribite como capitán y deja los datos de tus 5 jugadores. Te tomará 2 minutos.
          </p>
          <p className="font-mono text-xs text-white/45 mb-8">
            5 pasos cortos · Cero confusión · Email de confirmación a todos
          </p>
          <Link href="/inscribirse" className="btn-primary">
            Inscribir mi equipo →
          </Link>
        </div>
      </div>
    </section>
  );
}
