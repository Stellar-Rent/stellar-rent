import { Networks } from 'stellar-sdk';

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

export const HORIZON_URL =
  STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

// 1. Emisores OFICIALES de Circle (No cambiarlos nunca)
const MAINNET_USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const TESTNET_USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

// 2. Lógica de selección segura
const getUsdcIssuer = () => {
  if (STELLAR_NETWORK === 'mainnet') {
    // En Mainnet, prioriza la env var, pero si no está, usa el emisor real de Mainnet
    return process.env.NEXT_PUBLIC_USDC_ISSUER_MAINNET || MAINNET_USDC_ISSUER;
  }
  // En Testnet, usa la env var o el fallback de testnet
  return process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET || TESTNET_USDC_ISSUER;
};

export const USDC_ISSUER = getUsdcIssuer();

// 3. Aviso para el desarrollador
if (STELLAR_NETWORK === 'mainnet' && !process.env.NEXT_PUBLIC_USDC_ISSUER_MAINNET) {
  console.warn(
    '⚠️ Usando emisor de USDC hardcoded para Mainnet. Verifica NEXT_PUBLIC_USDC_ISSUER_MAINNET.'
  );
} else if (STELLAR_NETWORK === 'testnet' && !process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET) {
  console.warn(
    `⚠️ NEXT_PUBLIC_USDC_ISSUER_TESTNET no definida. Usando fallback de prueba: ${TESTNET_USDC_ISSUER}`
  );
}
