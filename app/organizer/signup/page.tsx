import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import OrganizerAuthForm from '@/components/OrganizerAuthForm';
import { getCurrentOrganizer } from '@/lib/organizer';

export const metadata: Metadata = {
  title: 'Crear cuenta organizador · Papaque',
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ next?: string }> };

export default async function OrganizerSignupPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const org = await getCurrentOrganizer();
  if (org) redirect(next || '/dashboard');

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
            Crear cuenta <span className="text-amber-gold">organizador</span>
          </h1>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Una cuenta de organizador te permite crear tus propios torneos, recibir
            inscripciones, manejar bracket y cobrar entradas.
          </p>
        </header>

        <OrganizerAuthForm mode="signup" next={next} />
      </div>
    </main>
  );
}
