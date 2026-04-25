import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';
import { isValidJoinCode } from '@/lib/codes';
import JoinForm, { type SlotInfo, type TeamSummary } from '@/components/JoinForm';
import SubscribeGate from '@/components/SubscribeGate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ code: string }> };

async function loadTeam(code: string): Promise<{ team: TeamSummary; slots: SlotInfo[] } | null> {
  const upper = code.toUpperCase();
  if (!isValidJoinCode(upper)) return null;

  const supabase = getServiceClient();

  const { data: team } = await supabase
    .from('teams')
    .select('id, team_name, captain_name, captain_steam, province')
    .eq('join_code', upper)
    .maybeSingle();

  if (!team) return null;

  const { data: members } = await supabase
    .from('team_members')
    .select('slot, nick')
    .eq('team_id', team.id);

  const confirmedBySlot = new Map<number, string>();
  (members ?? []).forEach((m) => confirmedBySlot.set(m.slot, m.nick));

  const slots: SlotInfo[] = [2, 3, 4, 5].map((s) => ({
    slot: s,
    nick_tentative: '',
    confirmed: confirmedBySlot.has(s),
    nick_final: confirmedBySlot.get(s) ?? null,
  }));

  return {
    team: {
      team_name: team.team_name,
      captain_name: team.captain_name,
      captain_steam: team.captain_steam ?? '',
      province: team.province,
    },
    slots,
  };
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;
  const data = await loadTeam(code);
  if (!data) notFound();

  const confirmados = data.slots.filter((s) => s.confirmed).length;

  return (
    <main className="min-h-screen px-4 py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1 mb-6"
        >
          ← Volver al sitio
        </Link>

        <header className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.3em] text-amber-gold/80 mb-3">
            PAPAQUE · INVITACIÓN DE EQUIPO
          </p>
          <h1 className="font-display text-2xl md:text-3xl text-white">
            Te invitaron a <span className="text-amber-gold">{data.team.team_name}</span>
          </h1>
        </header>

        <SubscribeGate>
          <div className="text-center mb-8">
            <p className="text-white/60 text-sm">
              Capitán: <span className="text-white/90">{data.team.captain_name}</span> ·{' '}
              <span className="text-white/90">{data.team.province}</span> ·{' '}
              <span className="text-white/90">{confirmados}/4 confirmados</span>
            </p>
          </div>
          <JoinForm code={code.toUpperCase()} team={data.team} slots={data.slots} />
        </SubscribeGate>
      </div>
    </main>
  );
}
