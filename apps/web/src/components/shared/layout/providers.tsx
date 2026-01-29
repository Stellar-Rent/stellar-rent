'use client';

import { ThemeProvider, useTheme } from 'next-themes';
import React from 'react';
import { AuthProvider } from '~/hooks/auth/use-auth';
import { StellarProvider } from '~/hooks/stellar/stellar-context';
import { TrustlessWorkProvider } from '~/providers/TrustlessWorkProvider';

/**
 * Syncs resolved theme to theme-portal-root. Must live inside ThemeProvider.
 */
function ThemePortalSync() {
  const { resolvedTheme } = useTheme();
  React.useEffect(() => {
    const portal =
      typeof window !== 'undefined' ? document.getElementById('theme-portal-root') : null;
    if (portal && resolvedTheme) portal.className = resolvedTheme;
  }, [resolvedTheme]);
  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

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
      enableSystem
      disableTransitionOnChange={false}
      storageKey="stellar-rent-theme"
    >
      <ThemePortalSync />
      <StellarProvider>
        <TrustlessWorkProvider>
          <AuthProvider>{children}</AuthProvider>
        </TrustlessWorkProvider>
      </StellarProvider>
    </ThemeProvider>
  );
}
