import type { Metadata } from 'next';
import { Black_Ops_One, Inter, JetBrains_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const display = Black_Ops_One({
  subsets: ['latin'],
  weight: '400',
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
  metadataBase: new URL('https://papaque.online'),
  title: 'Papaque — Torneo de Dota 2 · 2 de mayo',
  description:
    'Torneo online de Dota 2 para la comunidad cubana. 5v5, gratis, 2 de mayo. Premio: Logitech G502 HERO. Jugando como en los viejos tiempos.',
  openGraph: {
    title: 'Papaque — Torneo de Dota 2',
    description: 'Regístrate gratis. 2 de mayo. Premio: 5 Logitech G502 HERO. Jugando como en los viejos tiempos.',
    type: 'website',
    images: [{ url: '/papaque-logo.png', width: 600, height: 600, alt: 'Papaque · Torneo de Dota 2' }],
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
