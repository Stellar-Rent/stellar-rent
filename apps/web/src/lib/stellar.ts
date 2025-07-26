import { Asset, Horizon, Networks, Operation, TransactionBuilder } from 'stellar-sdk';

const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const USDC_ASSET = new Asset('USDC', USDC_ISSUER);

export async function createPaymentTransaction(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string
) {
  try {
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
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
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const transaction = TransactionBuilder.fromXDR(signedTransaction, Networks.TESTNET);
    const result = await server.submitTransaction(transaction);
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

//////////////////////////////////////////////
//Fetches the USDC balance for a given Stellar public key on the client-side.
/////////////////////////////////////////////

export async function getUSDCBalance(publicKey: string): Promise<string> {
  try {
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(publicKey);

    const usdcBalance = account.balances.find((balance) => {
      if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
        return balance.asset_code === USDC_ASSET.code && balance.asset_issuer === USDC_ASSET.issuer;
      }
      return false;
    });

    return usdcBalance ? usdcBalance.balance : '0';
  } catch (error) {
    console.error(`Error fetching USDC balance for ${publicKey}:`, error);
    return '0';
  }
}
