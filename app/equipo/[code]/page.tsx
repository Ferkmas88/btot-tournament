import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';
import { isValidJoinCode } from '@/lib/codes';
import TeamDashboard from '@/components/TeamDashboard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ code: string }> };

type TeamRow = {
  id: string;
  team_name: string;
  captain_name: string;
  province: string;
};

type Loaded = {
  team: { team_name: string; captain_name: string; province: string };
  slots: { slot: number; confirmed: boolean; nick_final: string | null }[];
};

async function loadTeam(code: string): Promise<Loaded | null> {
  const upper = code.toUpperCase();
  if (!isValidJoinCode(upper)) return null;

  const supabase = getServiceClient();

  const { data: team } = await supabase
    .from('teams')
    .select('id, team_name, captain_name, province')
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

  return {
    team: {
      team_name: team.team_name,
      captain_name: team.captain_name,
      province: team.province,
    },
    slots,
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

      <TeamDashboard joinCode={upper} team={loaded.team} initialSlots={loaded.slots} />
    </main>
  );
}
