import { Users, Calendar, Gamepad2, Trophy, MessageCircle, Radio } from 'lucide-react';

export default function Format() {
  const items = [
    { icon: Users, title: '5v5', text: 'Formato clásico. Cinco cubanos contra cinco cubanos.' },
    { icon: Calendar, title: '2 de mayo', text: 'Un solo día. Desde las 6 PM hora de Cuba.' },
    { icon: Gamepad2, title: 'Online', text: 'Todos los partidos por servidor dedicado.' },
    { icon: Trophy, title: 'Eliminación directa', text: 'Un BO1 en cuartos. BO3 desde semis.' },
    { icon: MessageCircle, title: 'Discord oficial', text: 'Comunicación, brackets y resultados en vivo.' },
    { icon: Radio, title: 'Streameado', text: 'Las finales se transmiten. Si te toca jugarla, que se vea.' },
  ];

  return (
    <section id="formato" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="stamp-heading mb-4">Formato</div>
          <h2 className="font-display text-4xl md:text-6xl text-white">
            Cómo se <span className="text-blood">juega</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="relative bg-ink-900/60 border border-white/10 p-6 hover:border-blood/50 transition"
            >
              <Icon className="w-7 h-7 text-amber-gold mb-4" strokeWidth={1.5} />
              <h3 className="font-display text-2xl text-white mb-2 tracking-wide">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
