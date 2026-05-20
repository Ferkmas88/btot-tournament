import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import RegisterWizard from '@/components/RegisterWizard';
import ResumeTeamBanner from '@/components/ResumeTeamBanner';
import RulesGate from '@/components/RulesGate';
import SubscribeGate from '@/components/SubscribeGate';
import { getCurrentProfile, getUser } from '@/lib/auth';
import { getActiveTournament, getOrganizer, whatsappLink } from '@/lib/tournaments';

export const metadata: Metadata = {
  title: 'Inscribir equipo · Papaque',
  description: 'Inscribe tu equipo al torneo de Dota 2.',
};

export const dynamic = 'force-dynamic';

export default async function InscribirsePage() {
  const user = await getUser();
  if (!user) {
    redirect('/auth/login?next=/inscribirse');
  }
  const profile = await getCurrentProfile();
  const captainName = profile?.steam_persona ?? profile?.display_name ?? user.email.split('@')[0];

  const tournament = await getActiveTournament();
  const organizer = tournament?.organizer_id ? await getOrganizer(tournament.organizer_id) : null;
  const waHref = whatsappLink(organizer?.contact_whatsapp);

  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-3xl mx-auto mb-8">
        <Link
          href="/"
          className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1"
        >
          ← Volver al sitio
        </Link>
      </div>

      <ResumeTeamBanner />

      <SubscribeGate>
        <RulesGate>
          <div className="max-w-2xl mx-auto mb-8">
            <header className="text-center">
              <p className="font-mono text-[10px] tracking-[0.3em] text-amber-gold/80 mb-2">
                {tournament ? tournament.name.toUpperCase() : 'PAPAQUE · INSCRIPCIÓN'}
              </p>
              <h1 className="font-display text-4xl md:text-5xl text-white">
                Inscribí tu <span className="text-amber-gold">equipo</span>
              </h1>
              <p className="text-white/60 text-sm mt-3 max-w-md mx-auto">
                Logueado como <span className="text-amber-gold">{captainName}</span>. Llename
                los datos del equipo y los 4 jugadores entran luego con su propio link.
              </p>

              {tournament && Number(tournament.entry_fee_per_team_usd) > 0 && (
                <div className="mt-6 inline-flex flex-col items-center gap-1 border border-amber-gold/30 bg-amber-gold/5 px-5 py-3">
                  <div className="font-display text-2xl text-amber-gold">
                    USD ${Number(tournament.entry_fee_per_team_usd).toFixed(0)}
                    <span className="font-mono text-xs text-white/55 ml-2 tracking-widest">/EQUIPO</span>
                  </div>
                  {Number(tournament.entry_fee_per_player_usd) > 0 && (
                    <div className="font-mono text-[11px] text-white/55 tracking-[0.18em]">
                      {tournament.team_size} jugadores × USD ${Number(tournament.entry_fee_per_player_usd).toFixed(0)}/jugador
                    </div>
                  )}
                </div>
              )}
            </header>
          </div>

          <RegisterWizard
            prefillCaptainName={captainName}
            prefillCaptainEmail={user.email}
            tournamentName={tournament?.name ?? null}
            entryFeePerTeamUsd={tournament ? Number(tournament.entry_fee_per_team_usd) : 0}
            entryFeePerPlayerUsd={tournament ? Number(tournament.entry_fee_per_player_usd) : 0}
            teamSize={tournament?.team_size ?? 5}
            paymentMethods={tournament?.payment_methods ?? ['card']}
            organizerName={organizer?.display_name ?? null}
            organizerWhatsappHref={waHref}
            organizerWhatsappRaw={organizer?.contact_whatsapp ?? null}
          />
        </RulesGate>
      </SubscribeGate>
    </main>
  );
}
