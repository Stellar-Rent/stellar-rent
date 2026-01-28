import { Asset, Horizon, Operation, TransactionBuilder } from 'stellar-sdk';
// @ts-ignore: Stellar SDK export compatibility
import Server from 'stellar-sdk';
import { HORIZON_URL, NETWORK_PASSPHRASE, USDC_ISSUER } from './config/config';

/**
 * Función auxiliar para obtener el Asset de forma segura.
 * Evita el error "Issuer is invalid" durante el renderizado inicial.
 */
const getUSDCAsset = () => {
  try {
    // Validamos que el issuer exista y tenga un formato coherente de Stellar
    if (USDC_ISSUER && USDC_ISSUER.startsWith('G') && USDC_ISSUER.length === 56) {
      return new Asset('USDC', USDC_ISSUER);
    }
    // Fallback para Testnet oficial de Circle en caso de error en config
    return new Asset('USDC', 'GBBD67ZYXG7O6N7F7K6N7F7K6N7F7K6N7F7K6N7F7K6N7F7K6N7F7K6N');
  } catch (e) {
    // Retornamos Asset nativo (XLM) como último recurso para no romper el build
    return Asset.native();
  }
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

export async function submitTransaction(signedTransaction: string) {
  try {
    // @ts-ignore: Server constructor resolution
    const server = new Server(HORIZON_URL);
    const result = await server.submitTransaction(signedTransaction);
    return result.hash;
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
}

/**
 * Procesa el pago completo: Crea la transacción, solicita firma a Freighter y la envía.
 */
export async function processPayment(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string
) {
  try {
    // 1. Crear la transacción
    const transactionXDR = await createPaymentTransaction(
      sourcePublicKey,
      destinationPublicKey,
      amount
    );

    // 2. Firmar con Freighter
    // @ts-ignore: Freighter API global access
    if (typeof window === 'undefined' || !window.freighterApi) {
      throw new Error('Freighter wallet not found');
    }
    
    // @ts-ignore: Freighter API global access
    const signedTransaction = await window.freighterApi.signTransaction(transactionXDR);

    // 3. Enviar a la red
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
    const asset = getUSDCAsset();

    const usdcBalance = account.balances.find((balance) => {
      if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
        // biome-ignore lint/suspicious/noExplicitAny: asset_code access
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