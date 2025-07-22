import * as StellarSdk from '@stellar/stellar-sdk';
import type { Server as SorobanRpcServer } from '@stellar/stellar-sdk/rpc';
import * as mockBookingContract from '../__mocks__/bookingContract';

const useMock = process.env.USE_MOCK === 'true';

// Initialize blockchain-related variables
let sourceKeypair: StellarSdk.Keypair;
let contractId: string;
let server: SorobanRpcServer;
let networkPassphrase: string;

if (!useMock) {
  const secretKey = process.env.STELLAR_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STELLAR_SECRET_KEY environment variable is required');
  }
  sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);

  const envContractId = process.env.SOROBAN_CONTRACT_ID;
  if (!envContractId) {
    throw new Error('SOROBAN_CONTRACT_ID environment variable is required');
  }
  contractId = envContractId;

  const rpcUrl = process.env.SOROBAN_RPC_URL;
  if (!rpcUrl) {
    throw new Error('SOROBAN_RPC_URL environment variable is required');
  }

  // Initialize server with proper error handling
  try {
    const { Server } = require('@stellar/stellar-sdk/rpc');
    server = new Server(rpcUrl);
  } catch (e) {
    console.error('Could not initialize Soroban RPC server:', e);
    throw new Error('Failed to initialize Soroban RPC server');
  }

  networkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE || StellarSdk.Networks.TESTNET;
}

export async function checkBookingAvailability(
  propertyId: string,
  from: string,
  to: string
): Promise<boolean> {
  if (useMock) {
    return mockBookingContract.checkBookingAvailability(propertyId, from, to);
  }

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

  try {
    const contract = new StellarSdk.Contract(contractId);

    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
    const startDateScVal = StellarSdk.nativeToScVal(startDate, { type: 'i64' });
    const endDateScVal = StellarSdk.nativeToScVal(endDate, { type: 'i64' });

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    })
      .addOperation(
        contract.call('check_availability', propertyIdScVal, startDateScVal, endDateScVal)
      )
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);

    // Type guard for successful simulation
    if ('results' in sim && Array.isArray(sim.results) && sim.results.length > 0) {
      const xdrResult = sim.results[0].xdr;
      const scVal = StellarSdk.xdr.ScVal.fromXDR(xdrResult, 'base64');
      const available = StellarSdk.scValToNative(scVal);

      // Fail open: if result is undefined/null, assume available
      if (available === undefined || available === null) {
        return true;
      }
      return Boolean(available);
    }

    // If simulation didn't return expected results, assume not available
    console.error('Simulation returned unexpected format:', sim);
    return false;
  } catch (error) {
    console.error('Blockchain availability check failed:', error);
    return false;
  }
}

// Re-export mock helpers for testing
export const { addMockBooking, clearMockBookings } = mockBookingContract;
