export default function Prize() {
  return (
    <section id="premio" className="relative py-24 px-4 stripes-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="stamp-heading mb-4">El Premio</div>
          <h2 className="font-display text-5xl md:text-7xl text-white mb-4">
            LOGITECH <span className="text-blood">G502 HERO</span>
          </h2>
          <p className="font-mono text-sm text-amber-gold tracking-[0.2em]">
            EL MOUSE QUE GANA TORNEOS · $50 USD
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-blood/20 blur-3xl" />
            <img
              src="/generated/prize-mouse.png"
              alt="Logitech G502 HERO"
              className="relative z-10 w-full max-w-md mx-auto"
            />
          </div>

          <div className="space-y-6">
            <Spec label="SENSOR" value="HERO 25K" detail="Hasta 25,600 DPI" />
            <Spec label="BOTONES" value="11 programables" detail="Memoria onboard" />
            <Spec label="PESO" value="Ajustable" detail="5 pesas de 3.6g" />
            <Spec label="CONEXIÓN" value="USB cable" detail="Trenzado · 2.1m" />
            <Spec label="ILUMINACIÓN" value="LIGHTSYNC RGB" detail="16.8M colores" />
            <div className="pt-6 border-t border-white/10">
              <p className="font-mono text-sm text-white/60 leading-relaxed">
                El mouse favorito de jugadores profesionales desde 2014. Lo ganó el capitán del
                equipo campeón. <span className="text-amber-gold">Un solo ganador. Un solo mouse.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Spec({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
      <span className="label-text text-amber-gold/80 mb-0">{label}</span>
      <div className="text-right">
        <div className="font-display text-2xl text-white">{value}</div>
        <div className="font-mono text-xs text-white/40">{detail}</div>
      </div>
    </div>
  );
}
