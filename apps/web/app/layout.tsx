import type { Metadata } from 'next';
import { Source_Serif_4, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

// Self-hosted at build time — no external font requests at runtime (see docs/adr/0007).
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-serif',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex-sans',
});

export const metadata: Metadata = {
  title: 'PhysioSim — Physiologie als System',
  description:
    'Interaktiver Physiologie-Simulator für Medizinstudierende: Blutdruckregulation, ' +
    'Niere und RAAS als ein zusammenhängendes Rechenmodell.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${sourceSerif.variable} ${plexSans.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
