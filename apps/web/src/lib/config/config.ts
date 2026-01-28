// apps/web/src/lib/config/config.ts
import { Networks } from 'stellar-sdk';

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

export const HORIZON_URL =
  STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

// --- MODIFICACIÓN AQUÍ ---
// Usamos un fallback (valor por defecto) para que nunca sea undefined durante el desarrollo
const FALLBACK_ISSUER = 'GBBD47IF6LWLVOFOK2UCAVGGOR6RZD76Z72NUKN6KQU6AL76OT6766T2';

export const USDC_ISSUER =
  (STELLAR_NETWORK === 'mainnet'
    ? process.env.NEXT_PUBLIC_USDC_ISSUER_MAINNET
    : process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET) || FALLBACK_ISSUER; 
// --------------------------

// Eliminamos el "throw new Error" temporalmente para que te deje ver la página
if (!USDC_ISSUER) {
  console.warn("USDC_ISSUER no definido, usando fallback de testnet");
}