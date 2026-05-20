import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile, getUser } from '@/lib/auth';
import ProfileMmrEditor from '@/components/ProfileMmrEditor';

export const metadata: Metadata = { title: 'Mi perfil · Papaque' };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ steam_ok?: string; steam_error?: string }> };

export default async function PerfilPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await getUser();
  if (!user) redirect('/auth/login?next=/perfil');

  const profile = await getCurrentProfile();
  const hasSteam = !!profile?.steam_id_64;
  const steamProfileUrl = profile?.steam_id_64
    ? `https://steamcommunity.com/profiles/${profile.steam_id_64}`
    : null;

  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1 mb-6"
        >
          ← Volver al sitio
        </Link>

        <header className="mb-8 flex items-center gap-4">
          {profile?.steam_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.steam_avatar_url}
              alt={profile.steam_persona ?? 'avatar'}
              className="w-20 h-20 rounded-sm border border-amber-gold/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-sm border border-white/15 bg-ink-900/60 flex items-center justify-center font-display text-3xl text-white/40">
              {(profile?.display_name ?? user.email)[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-white">
              {profile?.display_name || user.email}
            </h1>
            <p className="font-mono text-xs text-white/50">{user.email}</p>
            {profile?.steam_persona && (
              <p className="font-mono text-xs text-amber-gold/80 mt-1">
                Steam: {profile.steam_persona}
              </p>
            )}
          </div>
        </header>

        {sp.steam_ok && (
          <div className="border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 text-sm font-mono p-3 mb-6">
            ✓ Steam linkeado correctamente.
          </div>
        )}
        {sp.steam_error && (
          <div className="border border-blood bg-blood/10 text-blood-light text-sm font-mono p-3 mb-6">
            Error linkeando Steam: {sp.steam_error}
          </div>
        )}

        <section className="angled-panel p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-white">Cuenta Steam</h2>
            {hasSteam && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 border border-emerald-400/40 px-2 py-0.5">
                ✓ Linkeada
              </span>
            )}
          </div>

          {hasSteam ? (
            <div className="space-y-3">
              <div className="font-mono text-xs text-white/60 break-all">
                Steam ID: <span className="text-white">{profile?.steam_id_64}</span>
              </div>
              {steamProfileUrl && (
                <a
                  href={steamProfileUrl}
                  target="_blank"
                  rel="noopener"
                  className="btn-secondary text-sm inline-block"
                >
                  Ver perfil en Steam →
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-white/70 text-sm">
                Linkeá tu Steam para que tu MMR se traiga automáticamente desde OpenDota.
              </p>
              <a href="/api/auth/steam/redirect" className="btn-primary text-sm inline-block">
                Linkear Steam →
              </a>
            </div>
          )}
        </section>

        <section className="angled-panel p-6 md:p-8 mb-8">
          <h2 className="font-display text-2xl text-white mb-4">MMR</h2>
          <ProfileMmrEditor
            hasSteam={hasSteam}
            mmrEstimate={profile?.mmr_estimate ?? null}
            mmrSelfReported={profile?.mmr_self_reported ?? null}
          />
        </section>

        <form action="/auth/logout" method="POST">
          <button
            type="submit"
            className="font-mono text-xs uppercase tracking-wider text-white/50 hover:text-blood-light"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
