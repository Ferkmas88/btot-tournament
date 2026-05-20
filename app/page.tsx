import Hero from '@/components/Hero';
import UpcomingMatch from '@/components/UpcomingMatch';
import LiveStats from '@/components/LiveStats';
import Prize from '@/components/Prize';
import Format from '@/components/Format';
import Register from '@/components/Register';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

function isFutureDate(iso: string | undefined): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t > Date.now();
}

export default function HomePage() {
  const rawDate = process.env.NEXT_PUBLIC_TOURNAMENT_DATE;
  const tba = !isFutureDate(rawDate);
  const tournamentDate = rawDate ?? '2026-12-31T18:00:00-04:00';
  const telegramInvite = process.env.NEXT_PUBLIC_TELEGRAM_INVITE;

  return (
    <main>
      <Hero tournamentDate={tournamentDate} tba={tba} telegramInvite={telegramInvite} />

      {/* Poster LATAM teams */}
      <section className="relative overflow-hidden">
        <img
          src="/poster-teams.jpg"
          alt="P'APA QUE!? — Equipos LATAM"
          className="w-full h-auto block"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-ink-950" />
      </section>

      {!tba && <UpcomingMatch />}
      <LiveStats />
      <Prize />
      <Format />
      <Register />
      <Footer />
    </main>
  );
}
