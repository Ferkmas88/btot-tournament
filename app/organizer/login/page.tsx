import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import OrganizerAuthForm from '@/components/OrganizerAuthForm';
import { getCurrentOrganizer } from '@/lib/organizer';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Entrar como organizador · Papaque',
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ next?: string }> };

export default async function OrganizerLoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const user = await getUser();
  if (user) {
    const org = await getCurrentOrganizer();
    if (org) redirect(next || '/dashboard');
    redirect('/organizer/onboarding');
  }

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
            PAPAQUE · ORGANIZADORES
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-3">
            Entrar
          </h1>
        </header>

        <OrganizerAuthForm mode="login" next={next} />
      </div>
    </main>
  );
}
