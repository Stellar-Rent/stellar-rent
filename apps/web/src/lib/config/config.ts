import { Networks } from 'stellar-sdk';

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

export const HORIZON_URL =
  STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

// 1. Definimos el emisor real de la Testnet (Circle) como respaldo.
const TESTNET_USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

// 2. Intentamos usar la variable de entorno según la red.
const envIssuer =
  STELLAR_NETWORK === 'mainnet'
    ? process.env.NEXT_PUBLIC_USDC_ISSUER_MAINNET
    : process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET;

export const USDC_ISSUER = envIssuer || TESTNET_USDC_ISSUER;

// 3. CORRECCIÓN MINOR: Mensaje con el nombre exacto de la variable de entorno
if (!envIssuer) {
  const varName =
    STELLAR_NETWORK === 'mainnet'
      ? 'NEXT_PUBLIC_USDC_ISSUER_MAINNET'
      : 'NEXT_PUBLIC_USDC_ISSUER_TESTNET';

  console.warn(`⚠️ ${varName} no está definida. Usando fallback: ${TESTNET_USDC_ISSUER}`);
}
