import { Networks } from 'stellar-sdk';

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

export const HORIZON_URL =
  STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

// Emisor de prueba (solo para desarrollo/testnet)
const TESTNET_FALLBACK_ISSUER = 'GBBD47IF6LWLVOFOK2UCAVGGOR6RZD76Z72NUKN6KQU6AL76OT6766T2';

// 1. Obtenemos el valor de la variable de entorno según la red
const rawIssuer = STELLAR_NETWORK === 'mainnet'
  ? process.env.NEXT_PUBLIC_USDC_ISSUER_MAINNET
  : process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET;

// 2. Lógica de seguridad:
// - En mainnet: DEBE existir la variable, si no, lanzamos error (fail-fast).
// - En testnet: Si no existe, usamos el fallback.
export const USDC_ISSUER = (() => {
  if (STELLAR_NETWORK === 'mainnet') {
    if (!rawIssuer) {
      throw new Error("CRITICAL: USDC_ISSUER_MAINNET is not defined in environment variables.");
    }
    return rawIssuer;
  }
  
  // Para testnet o desarrollo
  if (!rawIssuer) {
    console.warn("USDC_ISSUER not defined, using testnet fallback.");
    return TESTNET_FALLBACK_ISSUER;
  }
  return rawIssuer;
})();