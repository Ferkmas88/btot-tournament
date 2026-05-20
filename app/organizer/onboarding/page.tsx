import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import OrganizerOnboardingForm from '@/components/OrganizerOnboardingForm';
import { getCurrentOrganizer } from '@/lib/organizer';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Completar perfil organizador · Papaque',
};

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ display_name?: string; whatsapp?: string; next?: string }>;
};

export default async function OrganizerOnboardingPage({ searchParams }: Props) {
  const user = await getUser();
  if (!user) redirect('/organizer/login');

  const org = await getCurrentOrganizer();
  if (org) redirect('/dashboard');

  const { display_name: dn, whatsapp, next } = await searchParams;

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-xl mx-auto">
        <header className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.3em] text-amber-gold/80 mb-2">
            PAPAQUE · ORGANIZADORES
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-3">
            Completá tu <span className="text-amber-gold">perfil</span>
          </h1>
          <p className="text-white/60 text-sm">
            Un último paso para empezar a crear torneos.
          </p>
        </header>

        <OrganizerOnboardingForm
          initialDisplayName={dn ?? ''}
          initialWhatsapp={whatsapp ?? ''}
          nextHref={next || '/dashboard'}
        />
      </div>
    </main>
  );
}
