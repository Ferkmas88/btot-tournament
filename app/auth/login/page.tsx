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

        <AuthForm mode="login" next={next} />
      </div>
    </main>
  );
}
