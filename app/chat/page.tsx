import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ChatRoom, { type Channel } from '@/components/ChatRoom';
import { getCurrentProfile, getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const metadata: Metadata = { title: 'Chat · Papaque' };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ ch?: string }> };

export default async function ChatPage({ searchParams }: Props) {
  const { ch: initialChannelKey } = await searchParams;
  const user = await getUser();
  if (!user) redirect('/auth/login?next=/chat');

  const profile = await getCurrentProfile();
  // Admin client porque teams/team_members tienen RLS sin policies de lectura.
  const admin = getSupabaseAdmin();

  type TeamLite = { id: string; team_name: string };
  let team: TeamLite | null = null;

  // Lookup como member.
  const { data: memberRow } = await admin
    .from('team_members')
    .select('team_id, teams ( id, team_name )')
    .eq('user_id', user.id)
    .maybeSingle<{
      team_id: string;
      teams: { id: string; team_name: string } | { id: string; team_name: string }[] | null;
    }>();

  if (memberRow?.teams) {
    team = Array.isArray(memberRow.teams) ? memberRow.teams[0] ?? null : memberRow.teams;
  }
  // Lookup como captain.
  if (!team) {
    const { data: captainTeam } = await admin
      .from('teams')
      .select('id, team_name')
      .eq('captain_user_id', user.id)
      .maybeSingle();
    if (captainTeam) team = captainTeam;
  }

  const channels: Channel[] = [
    { key: 'global', label: 'General', type: 'global', team_id: null },
  ];
  if (team) {
    channels.push({
      key: `team-${team.id}`,
      label: team.team_name,
      type: 'team',
      team_id: team.id,
    });
  }

  const display_name =
    profile?.steam_persona ?? profile?.display_name ?? user.email.split('@')[0];

  return (
    <ChatRoom
      currentUser={{
        id: user.id,
        email: user.email,
        display_name,
        avatar_url: profile?.steam_avatar_url ?? null,
      }}
      channels={channels}
      initialChannelKey={initialChannelKey}
    />
  );
}
