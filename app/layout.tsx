import type { Metadata } from 'next';
import { Oswald, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://btot-tournament.vercel.app'),
  title: 'BTOT Cuba — Torneo de Dota 2 · 2 de mayo',
  description:
    'Torneo online de Dota 2 para la comunidad cubana. 5v5, gratis, 2 de mayo. Premio: Logitech G502 HERO. Jugando como en los viejos tiempos.',
  openGraph: {
    title: 'BTOT Cuba — Torneo de Dota 2',
    description: 'Regístrate gratis. 2 de mayo. Premio: Logitech G502 HERO. Jugando como en los viejos tiempos.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="grain scanlines vignette">
        <div className="cuba-accent" />
        {children}
      </body>
    </html>
  );
}
