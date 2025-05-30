import { TransactionBuilder, Networks, Operation, Asset } from 'stellar-sdk';
import Server from 'stellar-sdk';

const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const USDC_ASSET = new Asset('USDC', USDC_ISSUER);

export async function createPaymentTransaction(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string
) {
  try {
    const server = new Server('https://horizon-testnet.stellar.org');
    const sourceAccount = await server.loadAccount(sourcePublicKey);

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: USDC_ASSET,
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

export async function submitTransaction(signedTransaction: string) {
  try {
    const server = new Server('https://horizon-testnet.stellar.org');
    const result = await server.submitTransaction(signedTransaction);
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
    // Create the transaction
    const transactionXDR = await createPaymentTransaction(
      sourcePublicKey,
      destinationPublicKey,
      amount
    );

    // Sign the transaction with Freighter
    if (typeof window === 'undefined' || !window.freighterApi) {
      throw new Error('Freighter wallet not found');
    }

    const signedTransaction = await window.freighterApi.signTransaction(transactionXDR);

    // Submit the signed transaction
    const transactionHash = await submitTransaction(signedTransaction);

    return transactionHash;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
} 