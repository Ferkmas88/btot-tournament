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
  metadataBase: new URL('https://btot.gg'),
  title: 'BY THE OLD TIME — Torneo Dota 2 para Cubanos',
  description:
    'El torneo de Dota 2 que honra la historia del juego en Cuba. 5v5, online, 2 de mayo. Premio: Logitech G502 HERO. Regístrate gratis.',
  openGraph: {
    title: 'BY THE OLD TIME — Torneo Dota 2 Cuba',
    description: 'Regístrate gratis. 2 de mayo. Premio: Logitech G502 HERO.',
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
