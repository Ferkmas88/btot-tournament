import Link from 'next/link';
import { getCurrentProfile, getUser } from '@/lib/auth';

export default async function Navbar() {
  let user = null;
  let profile = null;
  try {
    user = await getUser();
    if (user) profile = await getCurrentProfile();
  } catch {
    // Si falla auth, render como anonimo.
  }

  const initial = (profile?.display_name ?? user?.email ?? '?')[0].toUpperCase();
  const displayName = profile?.display_name || (user?.email ? user.email.split('@')[0] : '');

  return (
    <header className="sticky top-0 z-50 bg-ink-950/85 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/papaque-logo.png"
            alt="Papaque"
            className="w-8 h-8 rounded-sm border border-amber-gold/30 group-hover:border-amber-gold/70 transition"
          />
          <span className="font-display text-lg tracking-wider text-white group-hover:text-amber-gold transition hidden sm:inline">
            PAPAQUE
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="font-mono text-xs uppercase tracking-wider text-white/70 hover:text-amber-gold hidden md:inline"
            >
              💬 Chat
            </Link>
            <Link
              href="/perfil"
              className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 transition"
              title="Mi perfil"
            >
              {profile?.steam_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.steam_avatar_url}
                  alt={profile.steam_persona ?? displayName}
                  className="w-8 h-8 rounded-sm border border-amber-gold/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-sm border border-white/15 bg-ink-900 flex items-center justify-center font-display text-sm text-white/70">
                  {initial}
                </div>
              )}
              <span className="font-mono text-xs text-white/85 hidden sm:inline max-w-[140px] truncate">
                {displayName}
              </span>
            </Link>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-blood-light border border-white/10 hover:border-blood/40 px-2 py-1 transition"
              >
                Salir
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="font-mono text-xs uppercase tracking-wider text-white/70 hover:text-white"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="font-mono text-[11px] uppercase tracking-wider bg-amber-gold/15 border border-amber-gold/50 text-amber-gold hover:bg-amber-gold/25 px-3 py-1.5 transition"
            >
              Crear cuenta
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
