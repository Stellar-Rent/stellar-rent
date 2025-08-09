import './globals.css';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from '~/components/shared/layout/providers';

const geist = Geist({ subsets: ['latin'] });

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
      <body className={`${geist.className} min-h-screen bg-[#0B1320] text-white antialiased`}>
        <div id="theme-portal-root" />
        <Providers>
          <main className="flex-1 flex flex-col">{children}</main>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
