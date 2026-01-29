import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

import { Toaster } from 'react-hot-toast';
// CORRECCIÓN: La ruta es ../providers porque están al mismo nivel que components
import { Providers } from '~/components/shared/layout/providers';
import { Navbar } from '../components/layout/Navbar';
import { RightSidebar } from '../components/layout/RightSidebar';

const geist = Geist({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Stellar Rent',
  description: 'Alquileres con USDC en la red Stellar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={`${geist.className} bg-[#0B1221] min-h-screen antialiased text-white`}>
        <div id="theme-portal-root" />
        <Providers>
          <Navbar />
          <div className="flex flex-1 overflow-hidden pt-14">
            <main className="flex-1 flex flex-col min-w-0">{children}</main>
            <RightSidebar />
          </div>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
