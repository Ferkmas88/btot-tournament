import RegisterForm from './RegisterForm';

export default function Register() {
  return (
    <section id="registro" className="relative overflow-hidden px-4 py-24">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
        style={{ backgroundImage: "url('/generated/hero-cybercafe.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/88 to-ink-950" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <div className="stamp-heading mb-4">Inscripción</div>
          <h2 className="font-display text-4xl md:text-6xl text-white mb-4">
            Mete tu equipo al <span className="text-blood">torneo</span>
          </h2>
          <p className="font-mono text-sm text-amber-gold tracking-[0.2em]">
            GRATIS · 16 EQUIPOS MAX · CIERRE 1 DE MAYO 23:59
          </p>
        </div>
        <RegisterForm />
      </div>
    </section>
  );
}
