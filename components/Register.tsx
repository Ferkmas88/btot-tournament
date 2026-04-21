import RegisterForm from './RegisterForm';

export default function Register() {
  return (
    <section id="registro" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
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
