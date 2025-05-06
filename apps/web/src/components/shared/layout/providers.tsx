'use client';

import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import React from 'react';
import { StellarProvider } from '~/hooks/stellar/stellar-context';
import { AuthProvider } from '~/hooks/use-auth';

const ThemeProvider = dynamic(
  () => import('next-themes').then((mod) => ({ default: mod.ThemeProvider })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4">Cargando...</div>
      </div>
    ),
  }
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const portal =
      typeof window !== 'undefined'
        ? document.getElementById('theme-portal-root')
        : null;
    if (portal && resolvedTheme) {
      portal.className = resolvedTheme;
    }
  }, [resolvedTheme]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4">Cargando...</div>
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="stellar-rent-theme"
      value={{
        light: 'light',
        dark: 'dark',
        system: 'system',
      }}
    >
      <StellarProvider>
        <AuthProvider>{children}</AuthProvider>
      </StellarProvider>
    </ThemeProvider>
  );
}
