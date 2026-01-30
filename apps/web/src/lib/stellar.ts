import { Asset, Horizon, Operation, Transaction, TransactionBuilder } from 'stellar-sdk';
import { HORIZON_URL, NETWORK_PASSPHRASE, USDC_ISSUER } from './config/config';

const getUSDCAsset = () => {
  // Biome: useOptionalChain
  if (USDC_ISSUER?.startsWith('G') && USDC_ISSUER.length === 56) {
    return new Asset('USDC', USDC_ISSUER);
  }

  throw new Error(
    `Invalid USDC_ISSUER configuration. Check environment variables. Value: ${USDC_ISSUER}`
  );
};

export async function createPaymentTransaction(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string
) {
  try {
    const server = new Horizon.Server(HORIZON_URL);
    const sourceAccount = await server.loadAccount(sourcePublicKey);
    const asset = getUSDCAsset();

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: asset,
          amount: amount,
        })
      )
      .setTimeout(30)
      .build();

    return transaction.toXDR();
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    throw error;
  }
}

export async function submitTransaction(signedTransactionXDR: string) {
  try {
    const server = new Horizon.Server(HORIZON_URL);
    const transactionToSubmit = new Transaction(signedTransactionXDR, NETWORK_PASSPHRASE);

    const result = await server.submitTransaction(transactionToSubmit);
    return result.hash;
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
}

export async function processPayment(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string
) {
  try {
    const transactionXDR = await createPaymentTransaction(
      sourcePublicKey,
      destinationPublicKey,
      amount
    );

    // @ts-ignore: Freighter API global access
    if (typeof window === 'undefined' || !window.freighterApi) {
      throw new Error('Freighter wallet not found');
    }

    // @ts-ignore: Freighter API global access
    const signedTransaction = await window.freighterApi.signTransaction(transactionXDR);

    const transactionHash = await submitTransaction(signedTransaction);
    return transactionHash;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}

export async function getUSDCBalance(publicKey: string): Promise<string> {
  try {
    const server = new Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(publicKey);

    let asset: Asset;
    try {
      asset = getUSDCAsset();
    } catch (_e) {
      // Biome: Prepend with underscore for unused variable
      console.error('Cannot fetch balance: USDC Asset not configured.');
      return '0';
    }

    const usdcBalance = account.balances.find((balance) => {
      if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
        const b = balance as any;
        return b.asset_code === asset.code && b.asset_issuer === asset.issuer;
      }
      return false;
    });

    return usdcBalance ? usdcBalance.balance : '0';
  } catch (error) {
    console.error(`Error fetching USDC balance for ${publicKey}:`, error);
    return '0';
  }
}
