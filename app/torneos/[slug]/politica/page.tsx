import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServiceClient } from '@/lib/supabase';
import { getOrganizer, whatsappLink, type Tournament } from '@/lib/tournaments';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('tournaments')
    .select('name')
    .eq('slug', slug)
    .maybeSingle();
  return {
    title: data?.name ? `Política de inscripción · ${data.name}` : 'Política · Papaque',
  };
}

export default async function TournamentPolicyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getServiceClient();
  const { data: t } = await supabase.from('tournaments').select('*').eq('slug', slug).maybeSingle();
  const tournament = t as Tournament | null;
  if (!tournament) notFound();
  if (tournament.status === 'draft') notFound();

  const organizer = tournament.organizer_id ? await getOrganizer(tournament.organizer_id) : null;
  const waHref = whatsappLink(organizer?.contact_whatsapp);
  const methods = tournament.payment_methods ?? ['card'];
  const totalPlayers = tournament.team_size + (tournament.coach_required ? 1 : 0);
  const feePerTeam = Number(tournament.entry_fee_per_team_usd);
  const feePerPlayer = Number(tournament.entry_fee_per_player_usd);

  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/torneos/${tournament.slug}`}
          className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1 mb-6"
        >
          ← Volver al torneo
        </Link>

        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-gold/80 mb-2">
            POLÍTICA DE INSCRIPCIÓN
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-white">{tournament.name}</h1>
          <p className="text-white/55 text-sm mt-2">
            Términos aceptados al inscribirse. Aplican a todos los equipos participantes.
          </p>
        </header>

        <article className="space-y-10 text-white/80 text-sm leading-relaxed">
          <PolicySection number={1} title="Inscripción y registro">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Cada equipo se compone de {tournament.team_size} jugadores titulares
                {tournament.coach_required ? ' y un coach' : ''}
                {tournament.substitutes_allowed > 0
                  ? `, con hasta ${tournament.substitutes_allowed} sustitutos opcionales`
                  : ''}
                . Total {totalPlayers} miembros mínimos.
              </li>
              <li>
                El capitán es quien crea la inscripción y queda registrado como representante
                único del equipo ante el organizador.
              </li>
              <li>
                Los datos requeridos para inscripción son nombre del equipo, nombre del capitán,
                contacto (WhatsApp o Telegram), email y nicknames de cada jugador.
              </li>
            </ul>
          </PolicySection>

          <PolicySection number={2} title="Métodos de pago aceptados">
            <ul className="list-disc pl-5 space-y-1.5">
              {methods.includes('card') && (
                <li>
                  <strong className="text-white">Tarjeta (Lemon Squeezy):</strong> pago online con
                  Visa / Mastercard. La transacción se cobra al capitán en una sola operación de
                  USD ${feePerTeam.toFixed(0)}
                  {feePerPlayer > 0
                    ? ` (${tournament.team_size} × USD ${feePerPlayer.toFixed(0)} por jugador)`
                    : ''}
                  .
                </li>
              )}
              {methods.includes('whatsapp_alt') && (
                <li>
                  <strong className="text-white">Métodos alternativos:</strong> Western Union,
                  Remitly, transferencia bancaria o efectivo. Se coordinan vía WhatsApp con el
                  organizador antes de que el equipo sea confirmado.
                </li>
              )}
              <li>
                El equipo se considera inscrito y confirma cupo únicamente cuando el pago está
                registrado como completado.
              </li>
            </ul>
          </PolicySection>

          <PolicySection number={3} title="Reembolsos">
            <p>
              Se aceptan solicitudes de reembolso hasta{' '}
              <strong className="text-white">{tournament.refund_policy_days}</strong> día(s) antes
              del inicio del torneo. Después de esa fecha la inscripción no es reembolsable. Los
              reembolsos se procesan por el mismo medio de pago usado en la inscripción.
            </p>
          </PolicySection>

          <PolicySection number={4} title="Aceptación de términos">
            <p>
              Al inscribirse, el capitán reconoce haber leído esta política y aceptarla en nombre
              de su equipo. La inscripción implica también aceptar las reglas técnicas del torneo
              publicadas en la página principal del mismo.
            </p>
          </PolicySection>

          <PolicySection number={5} title="Responsabilidades del equipo">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                El capitán es responsable de presentar a {tournament.team_size} jugadores en cada
                partida agendada, dentro de los plazos comunicados.
              </li>
              <li>
                No-shows o forfeits sin aviso pueden resultar en eliminación sin reembolso.
              </li>
              <li>
                Cambios de jugadores titulares deben ser comunicados al organizador con al menos
                24 horas de anticipación.
              </li>
            </ul>
          </PolicySection>

          <PolicySection number={6} title="Verificación y elegibilidad">
            <ul className="list-disc pl-5 space-y-1.5">
              {tournament.mmr_min ? (
                <li>MMR mínimo individual: {tournament.mmr_min}.</li>
              ) : null}
              {tournament.mmr_max_per_team ? (
                <li>MMR máximo total por equipo: {tournament.mmr_max_per_team}.</li>
              ) : null}
              {tournament.rank_min ? <li>Rank mínimo: {tournament.rank_min}.</li> : null}
              {tournament.required_immortal_per_team > 0 ? (
                <li>
                  Mínimo {tournament.required_immortal_per_team} jugador(es) Immortal por equipo.
                </li>
              ) : null}
              <li>
                El organizador puede pedir verificación de cuentas (perfiles de Dota / Steam /
                etc.) antes o durante el torneo. Equipos que no puedan verificar quedarán
                descalificados sin reembolso.
              </li>
              <li>
                Smurfs y cuentas no declaradas están prohibidos.
              </li>
            </ul>
          </PolicySection>

          <PolicySection number={7} title="Conducta y disciplina">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Se espera trato respetuoso entre jugadores, organizador y staff. Insultos
                discriminatorios, acoso o amenazas son causal de descalificación.
              </li>
              <li>
                El uso de cheats, scripts o cualquier ventaja técnica es prohibido y resulta en
                descalificación inmediata y baneo del torneo.
              </li>
              <li>
                Las decisiones del organizador en materia disciplinaria son finales.
              </li>
              {tournament.anti_cheat_rules ? (
                <li className="text-white/65">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 mt-2 mb-1">
                    Reglas adicionales del organizador
                  </span>
                  <span className="block whitespace-pre-line">{tournament.anti_cheat_rules}</span>
                </li>
              ) : null}
            </ul>
          </PolicySection>
        </article>

        {organizer && (
          <footer className="mt-12 border-t border-white/10 pt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 mb-3">
              Organizador
            </p>
            <div className="font-display text-lg text-white">{organizer.display_name}</div>
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              {waHref && (
                <a href={waHref} target="_blank" rel="noreferrer" className="text-amber-gold hover:underline">
                  WhatsApp: {organizer.contact_whatsapp}
                </a>
              )}
              {organizer.contact_discord && (
                <span className="text-white/65">Discord: {organizer.contact_discord}</span>
              )}
              {organizer.contact_telegram && (
                <span className="text-white/65">Telegram: {organizer.contact_telegram}</span>
              )}
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}

function PolicySection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg text-white mb-3">
        <span className="font-mono text-[11px] text-amber-gold/80 mr-2">{String(number).padStart(2, '0')}</span>
        {title}
      </h2>
      <div className="pl-1">{children}</div>
    </section>
  );
}
