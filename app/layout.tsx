import type { Metadata } from 'next';
import { Black_Ops_One, Inter, JetBrains_Mono } from 'next/font/google';
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
  title: 'Papaque — Torneo de Dota 2 cubano · 2 de mayo',
  description:
    'Torneo cubano de Dota 2. 6 equipos, 5v5, online, gratis. Premio: 5 mouses Logitech G502 HERO para el equipo campeón. Inscribite y jugá como en los viejos tiempos.',
  keywords: ['Dota 2', 'torneo Cuba', 'Papaque', 'esports cubano', 'Logitech G502', '5v5'],
  openGraph: {
    title: 'Papaque — Torneo de Dota 2 cubano',
    description:
      '5 mouses Logitech G502 HERO para el equipo campeón. 2 de mayo, online, 5v5, gratis. Inscribite ya.',
    type: 'website',
    locale: 'es_CU',
    siteName: 'Papaque',
    images: [
      { url: '/sponsors-photo.jpeg', width: 1000, height: 750, alt: 'Premio: 5 Logitech G502 HERO' },
      { url: '/papaque-logo.png', width: 600, height: 600, alt: 'Papaque · Torneo de Dota 2' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Papaque — Torneo de Dota 2 cubano',
    description: '5 mouses Logitech G502 HERO para el equipo campeón. 2 mayo, gratis.',
    images: ['/sponsors-photo.jpeg'],
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
