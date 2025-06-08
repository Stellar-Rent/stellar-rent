import {
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc as stellarRpc,
  xdr,
} from '@stellar/stellar-sdk';

const secretKey = process.env.STELLAR_SECRET_KEY;
if (!secretKey) {
  throw new Error('STELLAR_SECRET_KEY environment variable is required');
}
const sourceKeypair = Keypair.fromSecret(secretKey);
const contractId = process.env.SOROBAN_CONTRACT_ID;
if (!contractId) {
  throw new Error('SOROBAN_CONTRACT_ID environment variable is required');
}
const rpcUrl = process.env.SOROBAN_RPC_URL;
if (!rpcUrl) {
  throw new Error('SOROBAN_RPC_URL environment variable is required');
}
const server = new stellarRpc.Server(rpcUrl);
const networkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET;

export async function checkBookingAvailability(
  propertyId: string,
  from: string,
  to: string
): Promise<boolean> {
  // Validate date strings
  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error('Invalid date format provided');
  }

  if (fromDate >= toDate) {
    throw new Error('From date must be before to date');
  }

  const startDate = Math.floor(fromDate.getTime() / 1000);
  const endDate = Math.floor(toDate.getTime() / 1000);

  // …rest of the implementation…

  try {
    const contract = new Contract(contractId);

    const propertyIdScVal = nativeToScVal(propertyId, { type: 'string' });
    const startDateScVal = nativeToScVal(startDate, { type: 'i64' });
    const endDateScVal = nativeToScVal(endDate, { type: 'i64' });

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase, // or your network
    })
      .addOperation(
        contract.call('check_availability', propertyIdScVal, startDateScVal, endDateScVal)
      )
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);

    if (!sim.result || sim.result.length === 0) {
      throw new Error('Simulation failed or returned no results');
    }
    const xdrResult = sim.result[0].xdr;
    const scVal = xdr.ScVal.fromXDR(xdrResult, 'base64');
    const available = scValToNative(scVal);

    // Fail open: if result is undefined/null, assume available
    if (available === undefined || available === null) {
      return true;
    }
    return Boolean(available);
  } catch (error) {
    console.error('Blockchain availability check failed:', error);
    return false;
  }
}
