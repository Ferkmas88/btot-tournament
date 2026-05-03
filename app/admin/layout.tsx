import type { Metadata } from 'next';
import Link from 'next/link';
import { isAuthed } from '@/lib/admin-auth';
import LogoutButton from '@/components/admin/LogoutButton';

export const metadata: Metadata = {
  title: 'Admin · Papaque',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthed();

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {authed && (
        <header className="border-b border-white/10 bg-black/40 sticky top-0 z-50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-display text-lg tracking-widest text-amber-gold">
                PAPAQUE · ADMIN
              </Link>
              <nav className="flex items-center gap-4 font-mono text-xs">
                <Link href="/admin" className="text-white/70 hover:text-white">
                  Equipos
                </Link>
                <Link href="/admin/round-robin" className="text-white/70 hover:text-white">
                  Round Robin
                </Link>
                <Link href="/admin/bracket" className="text-white/40 hover:text-white/70">
                  Bracket (legacy)
                </Link>
                <a href="/api/admin/export" className="text-white/70 hover:text-white">
                  Export CSV
                </a>
                <Link href="/" className="text-white/40 hover:text-white/70">
                  Ver sitio →
                </Link>
              </nav>
            </div>
            <LogoutButton />
          </div>
        </header>
      )}
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
