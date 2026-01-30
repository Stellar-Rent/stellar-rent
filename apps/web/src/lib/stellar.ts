import { Asset, Horizon, Operation, Transaction, TransactionBuilder } from 'stellar-sdk';
import { HORIZON_URL, NETWORK_PASSPHRASE, USDC_ISSUER } from './config/config';

/**
 * Interface for the response object returned by the Freighter wallet extension.
 * signTransaction returns an object, not just a string.
 */
interface FreighterSignResponse {
  signedTxXdr: string;
  signerAddress: string;
}

/**
 * Validates the USDC issuer configuration and returns an Asset instance.
 */
const getUSDCAsset = () => {
  if (USDC_ISSUER?.startsWith('G') && USDC_ISSUER.length === 56) {
    return new Asset('USDC', USDC_ISSUER);
  }
  throw new Error(`Invalid USDC_ISSUER configuration: ${USDC_ISSUER}`);
};

/**
 * Builds a payment transaction XDR for USDC.
 */
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

/**
 * Submits a signed transaction envelope to the Horizon server.
 */
export async function submitTransaction(signedTransactionXDR: string) {
  try {
    const server = new Horizon.Server(HORIZON_URL);

    /**
     * CodeRabbit Fix: Use TransactionBuilder.fromXDR for SDK v13 compliance.
     * This replaces the direct Transaction constructor call.
     */
    const transactionToSubmit = TransactionBuilder.fromXDR(
      signedTransactionXDR,
      NETWORK_PASSPHRASE
    );

    const result = await server.submitTransaction(transactionToSubmit as Transaction);
    return result.hash;
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
}

/**
 * Handles the complete flow: generation, wallet signing, and network submission.
 */
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

    // Ensure the wallet extension is available in the browser
    // @ts-ignore: Freighter API global access
    if (typeof window === 'undefined' || !window.freighterApi) {
      throw new Error('Freighter wallet not found');
    }

    // @ts-ignore: Freighter API global access
    const signedResponse = (await window.freighterApi.signTransaction(
      transactionXDR
    )) as FreighterSignResponse;

    /**
     * CodeRabbit Fix: Extract signedTxXdr from the response object.
     * Passing the entire object would cause a runtime error in submitTransaction.
     */
    const transactionHash = await submitTransaction(signedResponse.signedTxXdr);
    return transactionHash;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}

/**
 * Retrieves the USDC balance for a specific account.
 */
export async function getUSDCBalance(publicKey: string): Promise<string> {
  try {
    const server = new Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(publicKey);

    let asset: Asset;
    try {
      asset = getUSDCAsset();
    } catch (_error) {
      console.error('Balance fetch aborted: USDC Asset not configured.');
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
