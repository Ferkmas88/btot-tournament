import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActiveTournament } from '@/lib/tournaments';

export const metadata: Metadata = {
  title: 'Inscribir equipo · Papaque',
  description: 'Inscribite al torneo activo.',
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Compat: /inscribirse redirige al torneo activo. Si no hay torneo abierto,
// mostramos un mensaje con link al listado.
export default async function InscribirseRedirect() {
  const tournament = await getActiveTournament();
  if (tournament) {
    redirect(`/torneos/${tournament.slug}/inscribirse`);
  }

  return (
    <main className="min-h-screen px-4 py-14 md:py-20">
      <div className="max-w-xl mx-auto text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-amber-gold/80 mb-3">
          PAPAQUE · INSCRIPCIÓN
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-white mb-4">
          No hay torneos abiertos
        </h1>
        <p className="text-white/60 text-sm mb-8">
          Por ahora no hay ningún torneo recibiendo inscripciones. Mirá el listado completo o
          suscribite a la lista para enterarte cuando se abra el próximo.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link href="/torneos" className="btn-primary">
            Ver todos los torneos →
          </Link>
          <Link href="/" className="font-mono text-xs text-white/50 hover:text-white">
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </main>
  );
}
