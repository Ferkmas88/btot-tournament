import type { Metadata } from 'next';
import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Inscripción confirmada · Papaque',
  description: 'Confirmación de pago e inscripción al torneo.',
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = {
  searchParams: Promise<{ ref?: string }>;
};

type TeamRow = {
  team_name: string;
  captain_name: string;
  join_code: string;
  payment_status: 'pending' | 'paid' | 'refunded' | 'free';
  payment_amount_usd: number | null;
};

async function findTeam(paymentRef: string): Promise<TeamRow | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('teams')
    .select('team_name, captain_name, join_code, payment_status, payment_amount_usd')
    .eq('payment_ref', paymentRef)
    .maybeSingle();
  return (data as TeamRow | null) ?? null;
}

export default async function ExitoPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const team = ref ? await findTeam(ref) : null;
  const isPaid = team?.payment_status === 'paid';

  return (
    <main className="min-h-screen px-4 py-14 md:py-20">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-amber-gold/80 mb-3">
          PAPAQUE · INSCRIPCIÓN
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-white mb-5">
          {isPaid ? (
            <>
              Pago <span className="text-amber-gold">confirmado</span>
            </>
          ) : (
            <>Procesando tu pago</>
          )}
        </h1>

        {team ? (
          <div className="border border-white/10 bg-black/40 p-6 text-left mt-8">
            <Row label="Equipo" value={team.team_name} />
            <Row label="Capitán" value={team.captain_name} />
            <Row label="Código de equipo" value={team.join_code} mono />
            {team.payment_amount_usd ? (
              <Row label="Monto" value={`USD ${Number(team.payment_amount_usd).toFixed(2)}`} />
            ) : null}
            <Row
              label="Estado"
              value={
                team.payment_status === 'paid'
                  ? 'Pagado'
                  : team.payment_status === 'pending'
                  ? 'Procesando'
                  : team.payment_status === 'refunded'
                  ? 'Reembolsado'
                  : 'Sin costo'
              }
            />
            {!isPaid ? (
              <p className="text-white/55 text-sm mt-4">
                Lemon Squeezy a veces tarda algunos segundos en notificarnos. Recargá
                en 30 segundos. Si seguís acá después de 2 minutos, escribinos al Discord.
              </p>
            ) : (
              <p className="text-white/65 text-sm mt-4">
                Te mandamos un email con el link del equipo. Compartilo con tus jugadores
                para que se sumen.
              </p>
            )}
          </div>
        ) : (
          <p className="text-white/65 text-sm mt-6">
            No encontramos ese pago. Si pagaste, esperá unos segundos y recargá. Si el
            problema persiste, escribinos al Discord con tu nombre de equipo.
          </p>
        )}

        <div className="mt-10 flex flex-col gap-3 items-center">
          {team ? (
            <Link href={`/equipo/${team.join_code}`} className="btn-primary">
              Ir al equipo →
            </Link>
          ) : null}
          <Link href="/" className="font-mono text-xs text-white/50 hover:text-white">
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </span>
      <span className={`text-white text-sm ${mono ? 'font-mono tracking-widest' : ''}`}>
        {value}
      </span>
    </div>
  );
}
