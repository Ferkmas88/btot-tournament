export default function Prize() {
  return (
    <section id="premio" className="relative overflow-hidden px-4 py-24 stripes-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(194,63,50,0.18),transparent_34rem)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="stamp-heading mb-4">El Premio</div>
          <h2 className="font-display text-5xl md:text-7xl text-white mb-4">
            LOGITECH <span className="text-blood">G502 HERO</span>
          </h2>
          <p className="font-mono text-sm text-amber-gold tracking-[0.2em]">
            5 MOUSES · UNO PARA CADA JUGADOR DEL EQUIPO CAMPEÓN · $250 USD
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="image-frame relative p-3">
            <div className="absolute -inset-4 bg-blood/20 blur-3xl" />
            <img
              src="/sponsors-photo.jpeg"
              alt="Logitech G502 HERO — premio del torneo"
              className="relative z-10 w-full max-w-md mx-auto"
            />
            <p className="relative z-10 mt-4 text-center font-mono text-[11px] tracking-[0.2em] uppercase text-amber-gold/80">
              Esto es gracias al esfuerzo de{' '}
              <span className="text-white">Peter Chaun</span> y{' '}
              <span className="text-white">Fer</span> — originales del Dota cubano.
            </p>
          </div>

          <div className="angled-panel space-y-6 p-6 md:p-8">
            <Spec label="SENSOR" value="HERO 25K" detail="Hasta 25,600 DPI" />
            <Spec label="BOTONES" value="11 programables" detail="Memoria onboard" />
            <Spec label="PESO" value="Ajustable" detail="5 pesas de 3.6g" />
            <Spec label="CONEXIÓN" value="USB cable" detail="Trenzado · 2.1m" />
            <Spec label="ILUMINACIÓN" value="LIGHTSYNC RGB" detail="16.8M colores" />
            <div className="pt-6 border-t border-white/10">
              <p className="font-mono text-sm text-white/60 leading-relaxed">
                El mouse favorito de jugadores profesionales desde 2014. El equipo campeón se lleva{' '}
                <span className="text-amber-gold">5 mouses — uno para cada jugador.</span> Nadie se
                queda mirando.
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
