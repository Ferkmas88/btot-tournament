import { Calendar, Gamepad2, MessageCircle, Radio, Shield, Trophy, Users } from 'lucide-react';

export default function Format() {
  const items = [
    { icon: Users, title: '5v5 clasico', text: 'Cinco jugadores, capitan definido y roster cerrado antes del bracket.' },
    { icon: Calendar, title: '2 de mayo', text: 'Un solo dia. Desde las 6 PM hora de Cuba.' },
    { icon: Gamepad2, title: 'Online', text: 'Partidas coordinadas por Discord y sala dedicada.' },
    { icon: Trophy, title: 'Eliminacion', text: 'BO1 en cuartos. BO3 desde semifinales.' },
    { icon: MessageCircle, title: 'Discord oficial', text: 'Mesa de capitanes, resultados y avisos del torneo.' },
    { icon: Radio, title: 'Final visible', text: 'La final se transmite para que el campeon quede registrado.' },
  ];

  return (
    <section id="formato" className="relative overflow-hidden px-4 py-24">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(232,180,84,0.04),transparent_28%,rgba(37,135,205,0.08))]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="stamp-heading mb-4">Lobby competitivo</div>
            <h2 className="font-display text-4xl text-white md:text-6xl">
              Formato de <span className="text-blood">torneo</span>
            </h2>
            <p className="mt-5 max-w-xl text-white/62">
              La pagina ahora funciona como una pantalla principal: estado del evento, reglas rapidas,
              premio y bracket mental en una sola lectura. Menos folleto, mas lobby.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <LobbyStat icon={Shield} label="Regla base" value="Roster fijo" />
              <LobbyStat icon={Trophy} label="Objetivo" value="Campeon Papaque" />
            </div>
          </div>

          <div className="image-frame blue-glow p-2">
            <img
              src="/generated/bracket-arena.png"
              alt="Arena oscura de torneo con bracket azul y rojo"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map(({ icon: Icon, title, text }) => (
            <div key={title} className="metal-tile p-6 transition hover:border-amber-gold/45">
              <Icon className="mb-4 h-7 w-7 text-amber-gold" strokeWidth={1.5} />
              <h3 className="font-display text-2xl tracking-wide text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LobbyStat({ icon: Icon, label, value }: { icon: typeof Shield; label: string; value: string }) {
  return (
    <div className="angled-panel p-5">
      <Icon className="mb-3 h-6 w-6 text-amber-gold" strokeWidth={1.5} />
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">{label}</div>
      <div className="mt-1 font-display text-3xl text-white">{value}</div>
    </div>
  );
}
