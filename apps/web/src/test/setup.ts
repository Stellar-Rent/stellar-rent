import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_STELLAR_NETWORK = 'testnet';
process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET =
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID =
  'MCC7Q2SBA5C3RMNYZQ3J7Q6W5K7XQQ6K4X2X6X6X6X6X6X6X6X6X6X';
process.env.NEXT_PUBLIC_RPC_URL = 'https://soroban-testnet.stellar.org';

// If any tests use `jest` instead of `vi`, we can bridge them here
if (typeof globalThis.jest === 'undefined') {
  // biome-ignore lint/suspicious/noExplicitAny: Mocking global jest for compatibility
  (globalThis as any).jest = vi;
}
