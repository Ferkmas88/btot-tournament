import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthed } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase';
import TeamLinksCell from '@/components/admin/TeamLinksCell';

export const dynamic = 'force-dynamic';

type TeamRow = {
  id: string;
  team_name: string;
  captain_name: string;
  captain_email: string | null;
  captain_contact: string;
  contact_type: string;
  province: string;
  join_code: string | null;
  status: string;
  created_at: string;
};

type MemberCount = { team_id: string };

async function loadDashboard() {
  const supabase = getServiceClient();

  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .select(
      'id, team_name, captain_name, captain_email, captain_contact, contact_type, province, join_code, status, created_at',
    )
    .order('created_at', { ascending: false });

  if (teamsErr) throw new Error(teamsErr.message);

  const { data: members, error: memErr } = await supabase
    .from('team_members')
    .select('team_id');

  if (memErr) throw new Error(memErr.message);

  const countByTeam = new Map<string, number>();
  (members as MemberCount[] | null)?.forEach((m) => {
    countByTeam.set(m.team_id, (countByTeam.get(m.team_id) ?? 0) + 1);
  });

  return { teams: (teams ?? []) as TeamRow[], countByTeam };
}

export default async function AdminDashboard() {
  if (!(await isAuthed())) {
    redirect('/admin/login');
  }

  let teams: TeamRow[] = [];
  let countByTeam = new Map<string, number>();
  let error: string | null = null;

  try {
    const data = await loadDashboard();
    teams = data.teams;
    countByTeam = data.countByTeam;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error desconocido';
  }

  const totalEquipos = teams.length;
  const totalConfirmados = Array.from(countByTeam.values()).reduce((a, b) => a + b, 0);
  const equiposCompletos = teams.filter((t) => (countByTeam.get(t.id) ?? 0) === 4).length;
  const provincias = new Set(teams.map((t) => t.province)).size;

  return (
    <div>
      <header className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl text-white">Equipos registrados</h1>
          <p className="font-mono text-xs text-white/50 mt-1">
            Tabla viva. Refresca la página para ver nuevos registros.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Equipos" value={totalEquipos} />
        <Stat label="Completos (4/4)" value={equiposCompletos} />
        <Stat label="Confirmaciones" value={totalConfirmados} />
        <Stat label="Provincias" value={provincias} />
      </section>

      {teams.length === 0 ? (
        <div className="border border-white/10 p-10 text-center text-white/50 font-mono text-sm">
          Todavía no hay equipos registrados.
        </div>
      ) : (
        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 border-b border-white/10">
              <tr className="text-left">
                <Th>Equipo</Th>
                <Th>Capitán</Th>
                <Th>Email capitán</Th>
                <Th>Provincia</Th>
                <Th>Código</Th>
                <Th>Links</Th>
                <Th>Confirmados</Th>
                <Th>Estado</Th>
                <Th>Fecha</Th>
                <Th>—</Th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => {
                const confirmados = countByTeam.get(t.id) ?? 0;
                const completo = confirmados === 4;
                return (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                    <Td>
                      <span className="font-display text-base text-white">{t.team_name}</span>
                    </Td>
                    <Td>{t.captain_name}</Td>
                    <Td className="font-mono text-xs">{t.captain_email ?? '—'}</Td>
                    <Td>{t.province}</Td>
                    <Td className="font-mono text-amber-gold tracking-widest">
                      {t.join_code ?? '—'}
                    </Td>
                    <Td>
                      <TeamLinksCell
                        teamName={t.team_name}
                        joinCode={t.join_code}
                        captainContact={t.captain_contact}
                        contactType={t.contact_type}
                      />
                    </Td>
                    <Td>
                      <span
                        className={
                          completo
                            ? 'text-emerald-400 font-mono'
                            : confirmados > 0
                            ? 'text-amber-gold font-mono'
                            : 'text-white/40 font-mono'
                        }
                      >
                        {confirmados}/4
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={t.status} />
                    </Td>
                    <Td className="font-mono text-xs text-white/50">
                      {new Date(t.created_at).toLocaleString('es-CU', {
                        timeZone: 'America/Havana',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/equipos/${t.id}`}
                        className="font-mono text-xs text-amber-gold hover:underline"
                      >
                        ver →
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/10 bg-ink-900/40 p-4">
      <div className="font-mono text-[10px] tracking-[0.2em] text-amber-gold/80 uppercase">
        {label}
      </div>
      <div className="font-display text-3xl md:text-4xl text-white mt-1">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-mono text-[10px] tracking-[0.2em] text-amber-gold/80 uppercase px-3 py-3">
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle text-white/85 ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'border-amber-gold/40 text-amber-gold',
    confirmed: 'border-emerald-400/40 text-emerald-400',
    rejected: 'border-blood/40 text-blood-light',
    withdrawn: 'border-white/20 text-white/50',
  };
  const cls = colors[status] ?? 'border-white/20 text-white/50';
  return (
    <span className={`inline-block border px-2 py-0.5 font-mono text-[10px] uppercase ${cls}`}>
      {status}
    </span>
  );
}
