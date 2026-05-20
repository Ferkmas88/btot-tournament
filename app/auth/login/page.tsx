import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Entrar · Papaque',
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const user = await getUser();
  if (user) redirect(next || '/perfil');

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-xl mx-auto">
        <Link
          href="/"
          className="font-mono text-xs text-white/50 hover:text-white inline-flex items-center gap-1 mb-6"
        >
          ← Volver al sitio
        </Link>

        <header className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.3em] text-amber-gold/80 mb-2">
            PAPAQUE · CUENTA
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-3">
            Entrar
          </h1>
        </header>

        <a
          href="/api/auth/steam/redirect"
          className="block w-full text-center bg-[#171a21] hover:bg-[#2a3f5f] border border-[#66c0f4]/40 hover:border-[#66c0f4] text-white font-display tracking-wider text-lg py-4 transition mb-6"
        >
          🎮 Entrar con Steam →
        </a>

        <div className="flex items-center gap-3 my-6 text-white/30 font-mono text-[10px] uppercase tracking-wider">
          <div className="flex-1 h-px bg-white/10" />
          <span>o con email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <AuthForm mode="login" next={next} />
      </div>
    </main>
  );
}
