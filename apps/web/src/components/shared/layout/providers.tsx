'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { StellarProvider } from '~/hooks/stellar/stellar-context';
import { AuthProvider } from '~/hooks/use-auth';

const ThemeProvider = dynamic(
  () => import('next-themes').then((mod) => ({ default: mod.ThemeProvider })),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <StellarProvider>
        <AuthProvider>{children}</AuthProvider>
      </StellarProvider>
    </ThemeProvider>
  );
}
