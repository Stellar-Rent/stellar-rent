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

export async function createBookingOnChain(
  propertyId: string,
  guestId: string,
  fromTimestamp: number,
  toTimestamp: number,
  totalAmount: string,
  guests: number
): Promise<string> {
  if (useMock) {
    // Generate a mock booking ID for testing
    return `mock-booking-${Date.now()}`;
  }

  try {
    const contract = new StellarSdk.Contract(contractId);

    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
    const guestIdScVal = StellarSdk.nativeToScVal(guestId, { type: 'string' });
    const fromScVal = StellarSdk.nativeToScVal(fromTimestamp, { type: 'i64' });
    const toScVal = StellarSdk.nativeToScVal(toTimestamp, { type: 'i64' });
    const amountScVal = StellarSdk.nativeToScVal(totalAmount, { type: 'string' });
    const guestsScVal = StellarSdk.nativeToScVal(guests, { type: 'u32' });

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '1000',
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          'create_booking',
          propertyIdScVal,
          guestIdScVal,
          fromScVal,
          toScVal,
          amountScVal,
          guestsScVal
        )
      )
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);
    const result = await server.sendTransaction(tx);

    if (result.status === 'SUCCESS') {
      // Extract booking ID from transaction result
      const sim = await server.simulateTransaction(tx);
      if ('results' in sim && Array.isArray(sim.results) && sim.results.length > 0) {
        const xdrResult = sim.results[0].xdr;
        const scVal = StellarSdk.xdr.ScVal.fromXDR(xdrResult, 'base64');
        const bookingId = StellarSdk.scValToNative(scVal);
        return bookingId || result.hash;
      }
      return result.hash;
    }

    throw new Error(`Transaction failed with status: ${result.status}`);
  } catch (error) {
    console.error('Blockchain booking creation failed:', error);
    throw new Error(
      `Failed to create booking on chain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function cancelBookingOnChain(
  propertyId: string,
  bookingId: string,
  requestorId: string
): Promise<boolean> {
  if (useMock) {
    return true;
  }

  try {
    const contract = new StellarSdk.Contract(contractId);

    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
    const bookingIdScVal = StellarSdk.nativeToScVal(bookingId, { type: 'string' });
    const requestorIdScVal = StellarSdk.nativeToScVal(requestorId, { type: 'string' });

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '1000',
      networkPassphrase,
    })
      .addOperation(
        contract.call('cancel_booking', propertyIdScVal, bookingIdScVal, requestorIdScVal)
      )
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);
    const result = await server.sendTransaction(tx);

    return result.status === 'SUCCESS';
  } catch (error) {
    console.error('Blockchain booking cancellation failed:', error);
    throw new Error(
      `Failed to cancel booking on chain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateBookingStatusOnChain(
  propertyId: string,
  bookingId: string,
  newStatus: string,
  requestorId: string
): Promise<boolean> {
  if (useMock) {
    return true;
  }

  try {
    const contract = new StellarSdk.Contract(contractId);

    const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
    const bookingIdScVal = StellarSdk.nativeToScVal(bookingId, { type: 'string' });
    const statusScVal = StellarSdk.nativeToScVal(newStatus, { type: 'string' });
    const requestorIdScVal = StellarSdk.nativeToScVal(requestorId, { type: 'string' });

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '1000',
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          'update_status',
          propertyIdScVal,
          bookingIdScVal,
          statusScVal,
          requestorIdScVal
        )
      )
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);
    const result = await server.sendTransaction(tx);

    return result.status === 'SUCCESS';
  } catch (error) {
    console.error('Blockchain booking status update failed:', error);
    throw new Error(
      `Failed to update booking status on chain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Re-export mock helpers for testing
export const { addMockBooking, clearMockBookings } = mockBookingContract;

export interface BlockchainBookingResult {
  success: boolean;
  bookingId?: string;
  transactionHash?: string;
  error?: string;
}
