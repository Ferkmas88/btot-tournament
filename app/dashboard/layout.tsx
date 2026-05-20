import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireOrganizer } from '@/lib/organizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const organizer = await requireOrganizer();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-ink-950/85 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-display text-lg text-amber-gold">
              Dashboard
            </Link>
            <nav className="hidden sm:flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
              <Link href="/dashboard" className="hover:text-white">
                Torneos
              </Link>
              <Link href="/dashboard/torneos/nuevo" className="hover:text-white">
                + Nuevo
              </Link>
              <Link href="/dashboard/perfil" className="hover:text-white">
                Perfil
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-white/55 hidden md:inline">
              {organizer.display_name}
            </span>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-blood-light border border-white/10 hover:border-blood/40 px-2 py-1 transition"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10">{children}</div>
    </div>
  );
}
