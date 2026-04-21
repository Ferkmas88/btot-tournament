import Hero from '@/components/Hero';
import Prize from '@/components/Prize';
import Format from '@/components/Format';
import History from '@/components/History';
import Community from '@/components/Community';
import Register from '@/components/Register';
import Footer from '@/components/Footer';

export default function HomePage() {
  const tournamentDate = process.env.NEXT_PUBLIC_TOURNAMENT_DATE ?? '2026-05-02T18:00:00-04:00';

  return (
    <main>
      <Hero tournamentDate={tournamentDate} />
      <Prize />
      <Format />
      <History />
      <Community />
      <Register />
      <Footer />
    </main>
  );
}
