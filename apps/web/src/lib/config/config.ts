import { Networks } from 'stellar-sdk';

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

export const HORIZON_URL =
  STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

const MAINNET_USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const TESTNET_USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

const getUsdcIssuer = () => {
  if (STELLAR_NETWORK === 'mainnet') {
    return process.env.NEXT_PUBLIC_USDC_ISSUER_MAINNET || MAINNET_USDC_ISSUER;
  }
  return process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET || TESTNET_USDC_ISSUER;
};

export const USDC_ISSUER = getUsdcIssuer();

if (STELLAR_NETWORK === 'mainnet' && !process.env.NEXT_PUBLIC_USDC_ISSUER_MAINNET) {
  console.warn('Using hardcoded USDC issuer for Mainnet. Check NEXT_PUBLIC_USDC_ISSUER_MAINNET.');
} else if (STELLAR_NETWORK === 'testnet' && !process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET) {
  console.warn(
    `NEXT_PUBLIC_USDC_ISSUER_TESTNET not defined. Using fallback: ${TESTNET_USDC_ISSUER}`
  );
}
