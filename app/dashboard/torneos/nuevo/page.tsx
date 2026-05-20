import { requireOrganizer } from '@/lib/organizer';
import TournamentWizard from '@/components/TournamentWizard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function NewTournamentPage() {
  const organizer = await requireOrganizer();
  return (
    <div>
      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-gold/80 mb-2">
          DASHBOARD · NUEVO TORNEO
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-white">
          Crear <span className="text-amber-gold">torneo</span>
        </h1>
        <p className="text-white/55 text-sm mt-2">
          Configurás todos los campos paso a paso. Podés guardarlo como borrador y volver
          a editarlo antes de publicar.
        </p>
      </header>

      <TournamentWizard organizerName={organizer.display_name} />
    </div>
  );
}
