import Countdown from './Countdown';

type Props = { tournamentDate: string };

export default function Hero({ tournamentDate }: Props) {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden px-4 py-20">
      {/* background layer — generated hero image goes here */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('/generated/hero-cybercafe.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/60 to-ink-950" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div className="stamp-heading mb-6">Torneo online · 2 de mayo</div>

        <h1 className="font-display text-6xl md:text-9xl font-bold tracking-tight leading-[0.9] mb-4">
          <span className="block text-white">BY THE</span>
          <span className="block shine-text">OLD TIME</span>
        </h1>

        <p className="font-mono text-sm md:text-base text-amber-gold tracking-[0.3em] mb-2">
          DOTA 2 · 5v5 · CUBA
        </p>

        <p className="max-w-2xl mx-auto text-white/70 text-lg md:text-xl mb-12 mt-6">
          El torneo que honra los años de <span className="text-blood-light">fichas en los Joven Club</span>,
          los <span className="text-blood-light">LAN sin conexión</span>, y las noches de Dota 2 en cada provincia.
          Hoy se juega online. Pero el alma es la misma.
        </p>

        <div className="mb-14">
          <Countdown isoDate={tournamentDate} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="#registro" className="btn-primary">
            Registrar mi equipo
          </a>
          <a
            href="#premio"
            className="font-mono text-sm text-white/60 hover:text-amber-gold uppercase tracking-widest transition"
          >
            Ver el premio →
          </a>
        </div>

        <div className="mt-16 font-mono text-xs text-white/40 tracking-widest">
          GRATIS · SIN INSCRIPCIÓN · 16 EQUIPOS MAX
        </div>
      </div>
    </section>
  );
}
