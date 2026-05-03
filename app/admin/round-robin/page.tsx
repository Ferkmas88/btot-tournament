import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthed } from '@/lib/admin-auth';
import { loadRoundRobin, type RRMatch, type Standing, type TeamLite } from '@/lib/round-robin';
import RoundRobinAdmin from '@/components/admin/RoundRobinAdmin';

export const metadata: Metadata = { title: 'Admin · Round Robin' };
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AdminRoundRobinPage() {
  if (!(await isAuthed())) redirect('/admin/login');

  let teams: TeamLite[] = [];
  let matches: RRMatch[] = [];
  let standings: Standing[] = [];
  let error: string | null = null;
  try {
    const data = await loadRoundRobin();
    teams = data.teams;
    matches = data.matches;
    standings = data.standings;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error desconocido';
  }

  return (
    <div>
      <header className="mb-8 flex items-end justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin" className="font-mono text-xs text-white/50 hover:text-white">
            ← Admin
          </Link>
          <h1 className="font-display text-4xl text-white mt-2">Round Robin · BO3</h1>
          <p className="font-mono text-xs text-white/50 mt-1">
            Todos vs todos. {teams.length} equipos × {(teams.length * (teams.length - 1)) / 2} matches.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
          {error}
        </div>
      )}

      <RoundRobinAdmin teams={teams} matches={matches} standings={standings} />
    </div>
  );
}
