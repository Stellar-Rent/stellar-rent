import { Networks } from '@stellar/stellar-sdk';

export const getNetworkPassphrase = (network?: string | null): string => {
  switch (network?.toUpperCase()) {
    case 'PUBLIC':
    case 'MAINNET':
      return Networks.PUBLIC;
    case 'FUTURENET':
      return Networks.FUTURENET;
    default:
      return Networks.TESTNET;
  }
};

export const getNetworkName = (network?: string | null): string => {
  switch (network?.toUpperCase()) {
    case 'PUBLIC':
    case 'MAINNET':
      return 'PUBLIC';
    case 'FUTURENET':
      return 'FUTURENET';
    default:
      return 'TESTNET';
  }
};

export const getDefaultNetwork = (): string => {
  return 'TESTNET';
};

// Debug helper to log network info
export const logNetworkInfo = (walletNetwork?: string | null, appNetwork?: string) => {
  console.log('Network Debug Info:');
  console.log('  Wallet Network:', walletNetwork);
  console.log('  App Network:', appNetwork);
  console.log('  Resolved Passphrase:', getNetworkPassphrase(walletNetwork));
  console.log('  Networks.TESTNET:', Networks.TESTNET);
  console.log('  Networks.PUBLIC:', Networks.PUBLIC);
};
