import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jev Colosseum',
  description: 'A living AI arena where models fight, breed, mutate, and die. Drop your home GPU in.',
  openGraph: {
    title: 'Jev Colosseum',
    description: 'A living AI arena where models fight, breed, mutate, and die.',
    type: 'website',
    url: 'https://jev-colosseum.vercel.app',
  },
  twitter: {
    card: 'summary',
    title: 'Jev Colosseum',
    description: 'A living AI arena where models fight, breed, mutate, and die.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
