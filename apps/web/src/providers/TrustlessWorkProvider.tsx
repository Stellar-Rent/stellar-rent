'use client';

import {
  TrustlessWorkConfig,
  // development environment = "https://dev.api.trustlesswork.com"
  development,
  // mainnet environment = "https://api.trustlesswork.com"
  mainNet,
} from '@trustless-work/escrow';
import type React from 'react';

interface TrustlessWorkProviderProps {
  children: React.ReactNode;
}

export function TrustlessWorkProvider({ children }: TrustlessWorkProviderProps) {
  /**
   * Get the API key from the environment variables
   */
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

  return (
    <TrustlessWorkConfig baseURL={development} apiKey={apiKey}>
      {children}
    </TrustlessWorkConfig>
  );
}
