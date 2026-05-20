import Hero from '@/components/Hero';
import UpcomingMatch from '@/components/UpcomingMatch';
import LiveStats from '@/components/LiveStats';
import Prize from '@/components/Prize';
import Format from '@/components/Format';
import Register from '@/components/Register';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const tournamentDate = process.env.NEXT_PUBLIC_TOURNAMENT_DATE ?? '2026-05-02T18:00:00-04:00';

  return (
    <main>
      <Hero tournamentDate={tournamentDate} />

      {/* Poster LATAM teams */}
      <section className="relative overflow-hidden">
        <img
          src="/poster-teams.jpg"
          alt="P'APA QUE!? — Equipos LATAM"
          className="w-full h-auto block"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-ink-950" />
      </section>

      <UpcomingMatch />
      <LiveStats />
      <Prize />
      <Format />
      <Register />
      <Footer />
    </main>
  );
}
