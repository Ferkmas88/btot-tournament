import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/admin-auth';
import { loadBracket } from '@/lib/bracket';
import BracketAdmin from '@/components/admin/BracketAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AdminBracketPage() {
  if (!(await isAuthed())) redirect('/admin/login');

  let initialData;
  let error: string | null = null;
  try {
    initialData = await loadBracket();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error desconocido';
  }

  return (
    <div>
      <header className="mb-8 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl text-white">Bracket</h1>
          <p className="font-mono text-xs text-white/50 mt-1">
            Asigná equipos a las semifinales y marcá ganadores. La final se llena automáticamente.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
          {error}
        </div>
      )}

      {initialData && (
        <BracketAdmin matches={initialData.matches} teams={initialData.teams} />
      )}
    </div>
  );
}
