import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '~/components/layout/Navbar';
import { Providers } from '~/components/shared/layout/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StellaRent',
  description: 'Plataforma de alquiler de propiedades',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}
      >
        <div id="theme-portal-root" />
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-between p-2">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
