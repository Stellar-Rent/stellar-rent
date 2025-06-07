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

const contractId = process.env.SOROBAN_CONTRACT_ID;
if (!contractId) {
  throw new Error('BOOKING_CONTRACT_ID environment variable is required');
}
const rpcUrl = process.env.SOROBAN_RPC_URL;
if (!rpcUrl) {
  throw new Error('SOROBAN_RPC_URL environment variable is required');
}
const server = new stellarRpc.Server(rpcUrl);

export async function checkBookingAvailability(
  propertyId: string,
  from: string,
  to: string
): Promise<boolean> {
  const startDate = Math.floor(new Date(from).getTime() / 1000);
  const endDate = Math.floor(new Date(to).getTime() / 1000);
  const contract = new Contract(contractId as string);

  try {
    // Call the contract's check_availability function
    // You may need to adjust argument types depending on your contract's ABI
    const propertyIdScVal = nativeToScVal(propertyId, { type: 'string' });
    const startDateScVal = nativeToScVal(startDate, { type: 'i64' });
    const endDateScVal = nativeToScVal(endDate, { type: 'i64' });
    const sourceKeypair = Keypair.random();
    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.TESTNET, // or your network
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

    return Boolean(available);
  } catch (error) {
    console.error('Blockchain availability check failed:', error);
    // Fail closed: treat as unavailable if blockchain call fails
    return false;
  }
}
