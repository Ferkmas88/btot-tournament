import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';
import { isValidJoinCode } from '@/lib/codes';
import { getOrganizer, whatsappLink, type Organizer } from '@/lib/tournaments';
import TeamDashboard from '@/components/TeamDashboard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ code: string }> };

type TeamRow = {
  id: string;
  team_name: string;
  captain_name: string;
  province: string;
  tournament_id: string | null;
  payment_status: 'pending' | 'paid' | 'refunded' | 'free' | null;
  payment_method: 'card' | 'offline' | null;
  payment_amount_usd: number | null;
};

type Loaded = {
  team: { team_name: string; captain_name: string; province: string };
  slots: { slot: number; confirmed: boolean; nick_final: string | null }[];
  payment: {
    status: TeamRow['payment_status'];
    method: TeamRow['payment_method'];
    amount: number | null;
  };
  organizer: Organizer | null;
};

async function loadTeam(code: string): Promise<Loaded | null> {
  const upper = code.toUpperCase();
  if (!isValidJoinCode(upper)) return null;

  const supabase = getServiceClient();

  const { data: team } = await supabase
    .from('teams')
    .select(
      'id, team_name, captain_name, province, tournament_id, payment_status, payment_method, payment_amount_usd',
    )
    .eq('join_code', upper)
    .maybeSingle<TeamRow>();

  if (!team) return null;

  const { data: members } = await supabase
    .from('team_members')
    .select('slot, nick')
    .eq('team_id', team.id);

  const confirmedBySlot = new Map<number, string>();
  (members ?? []).forEach((m) => confirmedBySlot.set(m.slot, m.nick));

  const slots = [2, 3, 4, 5].map((s) => ({
    slot: s,
    confirmed: confirmedBySlot.has(s),
    nick_final: confirmedBySlot.get(s) ?? null,
  }));

  let organizer: Organizer | null = null;
  if (team.tournament_id) {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('organizer_id')
      .eq('id', team.tournament_id)
      .maybeSingle<{ organizer_id: string | null }>();
    if (tournament?.organizer_id) {
      organizer = await getOrganizer(tournament.organizer_id);
    }
  }

  return {
    team: {
      team_name: team.team_name,
      captain_name: team.captain_name,
      province: team.province,
    },
    slots,
    payment: {
      status: team.payment_status,
      method: team.payment_method,
      amount: team.payment_amount_usd != null ? Number(team.payment_amount_usd) : null,
    },
    organizer,
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  return { title: `Equipo ${code.toUpperCase()} · Papaque` };
}

export default async function EquipoPage({ params }: PageProps) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const loaded = await loadTeam(upper);
  if (!loaded) notFound();

  const offlinePending =
    loaded.payment.status === 'pending' && loaded.payment.method === 'offline';
  const cardPending =
    loaded.payment.status === 'pending' && loaded.payment.method === 'card';
  const waHref = whatsappLink(loaded.organizer?.contact_whatsapp);

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

      {(offlinePending || cardPending) && (
        <div className="max-w-3xl mx-auto mb-6 border border-amber-gold/40 bg-amber-gold/5 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-gold mb-2">
            Pago pendiente
          </div>
          {offlinePending ? (
            <>
              <p className="text-white/85 text-sm">
                Tu equipo está reservado. Para confirmar la inscripción, coordiná el pago de{' '}
                {loaded.payment.amount ? (
                  <span className="text-amber-gold">USD ${loaded.payment.amount.toFixed(0)}</span>
                ) : (
                  'la inscripción'
                )}{' '}
                con{' '}
                <span className="text-amber-gold">
                  {loaded.organizer?.display_name ?? 'el organizador'}
                </span>
                .
              </p>
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex mt-3"
                >
                  Coordinar por WhatsApp →
                </a>
              )}
              <p className="text-white/45 text-xs mt-3">
                Medios aceptados: Western Union, Remitly, transferencia bancaria, efectivo.
              </p>
            </>
          ) : (
            <p className="text-white/85 text-sm">
              Tu pago con tarjeta está en proceso. Si ya pagaste, recargá esta página en unos
              segundos. Lemon Squeezy a veces tarda hasta 1-2 minutos en confirmar.
            </p>
          )}
        </div>
      )}

      <TeamDashboard joinCode={upper} team={loaded.team} initialSlots={loaded.slots} />
    </main>
  );
}
