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
          className="w-full object-cover max-h-[480px] object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
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
