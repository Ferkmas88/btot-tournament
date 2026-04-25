export default function Footer() {
  const year = new Date().getFullYear();
  const discord = process.env.NEXT_PUBLIC_DISCORD_INVITE ?? '#';
  return (
    <footer className="relative py-16 px-4 border-t border-blood/20">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="font-display text-4xl text-white mb-2 tracking-tight">
              PAPA<span className="text-blood">QUE</span>
            </div>
            <p className="font-mono text-xs text-amber-gold/80 tracking-widest mb-3">
              JUGANDO COMO EN LOS VIEJOS TIEMPOS
            </p>
            <p className="text-white/60 text-sm">
              Hecho por cubanos, para cubanos. En cualquier parte del mundo donde estés, sigues
              jugando con los tuyos.
            </p>
          </div>

          <div>
            <div className="label-text">Comunidad</div>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><a href={discord} className="hover:text-amber-gold transition">Discord oficial</a></li>
              <li><a href="#historia" className="hover:text-amber-gold transition">Historia Dota Cuba</a></li>
              <li><a href="#comunidad" className="hover:text-amber-gold transition">Selecciones y canales</a></li>
              <li><a href="/inscribirse" className="hover:text-amber-gold transition">Inscribir equipo</a></li>
            </ul>
          </div>

          <div>
            <div className="label-text">Próximos eventos</div>
            <p className="text-white/60 text-sm mb-3">
              Al Discord primero. Torneos mensuales, ligas por provincia, premios más grandes si la
              comunidad crece.
            </p>
            <a href={discord} className="inline-block font-mono text-xs text-amber-gold border border-amber-gold/40 px-4 py-2 hover:bg-amber-gold hover:text-ink-950 transition tracking-widest">
              SUSCRIBIRME →
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-white/30">
            © {year} Papaque · Por la comunidad cubana de Dota 2
          </p>
          <p className="font-mono text-xs text-white/30">
            Producido por <span className="text-amber-gold">Digital AM</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
