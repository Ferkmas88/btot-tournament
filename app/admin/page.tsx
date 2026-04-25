import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthed } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type TeamRow = {
  id: string;
  team_name: string;
  captain_name: string;
  captain_email: string | null;
  captain_contact: string;
  contact_type: string;
  province: string;
  status: string;
  created_at: string;
  player_2_email: string | null;
  player_3_email: string | null;
  player_4_email: string | null;
  player_5_email: string | null;
};

async function loadDashboard() {
  const supabase = getServiceClient();

  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .select(
      'id, team_name, captain_name, captain_email, captain_contact, contact_type, province, status, created_at, player_2_email, player_3_email, player_4_email, player_5_email',
    )
    .order('created_at', { ascending: false });

  if (teamsErr) throw new Error(teamsErr.message);

  return { teams: (teams ?? []) as TeamRow[] };
}

export default async function AdminDashboard() {
  if (!(await isAuthed())) {
    redirect('/admin/login');
  }

  let teams: TeamRow[] = [];
  let error: string | null = null;

  try {
    const data = await loadDashboard();
    teams = data.teams;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error desconocido';
  }

  const totalEquipos = teams.length;
  const totalJugadores = teams.length * 5;
  const provincias = new Set(teams.map((t) => t.province)).size;
  const conTodosEmails = teams.filter(
    (t) =>
      t.captain_email &&
      t.player_2_email &&
      t.player_3_email &&
      t.player_4_email &&
      t.player_5_email,
  ).length;

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
        <Stat label="Jugadores" value={totalJugadores} />
        <Stat label="Con todos los emails" value={conTodosEmails} />
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
                <Th>Contacto</Th>
                <Th>Provincia</Th>
                <Th>Estado</Th>
                <Th>Fecha</Th>
                <Th>—</Th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <Td>
                    <span className="font-display text-base text-white">{t.team_name}</span>
                  </Td>
                  <Td>{t.captain_name}</Td>
                  <Td className="font-mono text-xs">{t.captain_email ?? '—'}</Td>
                  <Td className="font-mono text-xs">
                    <span className="text-amber-gold/80 mr-1">{t.contact_type}</span>
                    {t.captain_contact}
                  </Td>
                  <Td>{t.province}</Td>
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
              ))}
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
