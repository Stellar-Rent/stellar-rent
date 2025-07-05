import {
  Address,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
/**
 * Type definitions to help with Stellar SDK compatibility
 */
/** Stellar Account interface with minimally required properties */
// Import Account type from stellar-sdk to ensure compatibility
import type { Account } from '@stellar/stellar-sdk';

interface StellarAccount extends Account {
  // Account interface already has sequenceNumber and accountId
  // Adding incrementSequenceNumber to match Account interface
  incrementSequenceNumber: () => void;
  [key: string]: unknown | (() => string) | (() => unknown) | (() => void);
}

interface StellarResponse {
  hash?: string;
  status?: string;
  returnValue?: { xdr: string } | null;
  result?: { xdr: string } | null;
  results?: Array<{ xdr: string }>;
  // Allow additional properties with stricter typing
  [key: string]: string | boolean | number | null | undefined | object | Array<unknown>;
}

/**
 * Server interface for Soroban/Stellar SDK.
 *
 * Using a flexible type definition to accommodate different SDK versions.
 * We're intentionally using looser types to ensure compatibility across versions,
 * while providing minimal documentation about expected shapes.
 */
type ServerType = {
  /** Gets account information from the ledger */
  getAccount: (pubKey: string) => Promise<StellarAccount>;
  /** Simulates transaction execution without submitting to the network */
  simulateTransaction: (tx: unknown) => Promise<StellarResponse>;
  /** Submits a transaction to the network */
  sendTransaction: (tx: unknown) => Promise<StellarResponse>;
  /** Gets transaction details by hash */
  getTransaction: (hash: string) => Promise<StellarResponse>;
};
import * as mockBookingContract from '../__mocks__/bookingContract';
import type { BookingStatus } from './types';

/**
 * Wait for a transaction to be confirmed on the Stellar blockchain.
 * @param txHash Transaction hash to monitor
 * @returns The transaction response when confirmed
 */
async function waitForTransactionConfirmation(txHash: string): Promise<StellarResponse> {
  if (!txHash) {
    throw new Error('Transaction hash is required');
  }

  // Maximum number of attempts to check transaction status
  const maxAttempts = 10;
  // Delay between attempts in milliseconds
  const delayMs = 2000;

  // Initialize attempts counter
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const txResponse = await server.getTransaction(txHash);

      // Just to ensure TypeScript knows we're using txResponse
      // Use txResponse in a way that affects the flow to avoid unused variable warning
      if (txResponse) {
        attempts = txResponse.status === 'FAILED' ? maxAttempts - 1 : attempts;
        console.debug(
          `Checking transaction ${txHash}: ${txResponse.status || 'pending'}, attempt: ${attempts + 1}`
        );
      }

      if (txResponse.status === 'SUCCESS' || txResponse.status === 'FAILED') {
        return txResponse;
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempts++;
    } catch (error) {
      console.error(`Error checking transaction ${txHash} on attempt ${attempts + 1}:`, error);
      // Still count this as an attempt
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error(`Failed to confirm transaction after ${maxAttempts} attempts`);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Transaction confirmation timed out after ${maxAttempts} attempts`);
}

const useMock = process.env.USE_MOCK === 'true';

// Initialize blockchain-related variables
let sourceKeypair: Keypair;
let contractId: string;
// Use interface type for server to avoid SDK version compatibility issues
let server: ServerType;
let networkPassphrase: string;

if (!useMock) {
  const secretKey = process.env.STELLAR_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STELLAR_SECRET_KEY environment variable is required');
  }
  sourceKeypair = Keypair.fromSecret(secretKey);

  const envContractId = process.env.SOROBAN_CONTRACT_ID;
  if (!envContractId) {
    throw new Error('SOROBAN_CONTRACT_ID environment variable is required');
  }
  contractId = envContractId;

  const rpcUrl = process.env.SOROBAN_RPC_URL;
  if (!rpcUrl) {
    throw new Error('SOROBAN_RPC_URL environment variable is required');
  }
  // Use dynamic import to access the server constructor
  // @ts-ignore - Ignoring type checks for dynamic SDK access
  server = new (
    require('@stellar/stellar-sdk').Soroban?.Server ||
    require('@stellar/stellar-sdk').SorobanRpc?.Server ||
    require('@stellar/stellar-sdk').Server
  )(rpcUrl);
  networkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET;
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
    const contract = new Contract(contractId);

    const propertyIdScVal = nativeToScVal(propertyId, { type: 'string' });
    const startDateScVal = nativeToScVal(startDate, { type: 'i64' });
    const endDateScVal = nativeToScVal(endDate, { type: 'i64' });

    // Cast to Account type to satisfy TransactionBuilder requirements
    const account = (await server.getAccount(sourceKeypair.publicKey())) as Account;
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    })
      .addOperation(
        contract.call('check_availability', propertyIdScVal, startDateScVal, endDateScVal)
      )
      .setTimeout(30)
      .build();

    // Simulate the transaction
    const sim = await server.simulateTransaction(tx);

    // Type guard for successful simulation
    if ('results' in sim && sim.results && Array.isArray(sim.results) && sim.results.length > 0) {
      // Safe access with type assertion
      const firstResult = sim.results[0] as { xdr: string };
      const xdrResult = firstResult.xdr;
      const scVal = xdr.ScVal.fromXDR(xdrResult, 'base64');
      const available = scValToNative(scVal);

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

/**
 * Create a new booking on the blockchain
 * @param propertyId - Property ID to book
 * @param userId - User ID making the booking
 * @param startDate - Start date string
 * @param endDate - End date string
 * @param totalPrice - Total price in smallest currency unit
 * @returns Booking ID from blockchain
 */
export async function createBooking(
  propertyId: string,
  userId: string,
  startDate: string,
  endDate: string,
  totalPrice: number
): Promise<string> {
  if (useMock) {
    return mockBookingContract.createBooking(propertyId, userId, startDate, endDate, totalPrice);
  }

  // Validate date strings
  const fromDate = new Date(startDate);
  const toDate = new Date(endDate);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error('Invalid date format provided');
  }

  if (fromDate >= toDate) {
    throw new Error('Start date must be before end date');
  }

  const startTimestamp = Math.floor(fromDate.getTime() / 1000);
  const endTimestamp = Math.floor(toDate.getTime() / 1000);

  try {
    const contract = new Contract(contractId);

    const propertyIdScVal = nativeToScVal(propertyId, { type: 'string' });
    const userIdScVal = nativeToScVal(userId, { type: 'string' });
    const startDateScVal = nativeToScVal(startTimestamp, { type: 'u64' });
    const endDateScVal = nativeToScVal(endTimestamp, { type: 'u64' });
    const totalPriceScVal = nativeToScVal(totalPrice, { type: 'i128' });

    // Cast to Account type to satisfy TransactionBuilder requirements
    const account = (await server.getAccount(sourceKeypair.publicKey())) as Account;
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          'create_booking',
          propertyIdScVal,
          userIdScVal,
          startDateScVal,
          endDateScVal,
          totalPriceScVal
        )
      )
      .setTimeout(30)
      .build();

    // Sign the transaction
    tx.sign(sourceKeypair);

    // Submit transaction to the network
    const response = await server.sendTransaction(tx);

    // Handle response
    if (!response.hash) {
      throw new Error('No transaction hash returned');
    }

    // Wait for confirmation if needed
    const txResponse = await waitForTransactionConfirmation(response.hash);

    if (txResponse.status === 'SUCCESS') {
      // Parse the result (assuming it's a boolean encoded as an xdr ScVal)
      const result = txResponse.returnValue as { xdr: string };
      if (!result) {
        throw new Error('No booking ID returned from contract');
      }

      // Convert XDR result to native JS type (booking ID)
      const scVal = xdr.ScVal.fromXDR(result.xdr, 'base64');
      const bookingId = String(scValToNative(scVal));

      return bookingId;
    }

    throw new Error(`Transaction failed with status: ${txResponse.status}`);
  } catch (error) {
    console.error('Blockchain booking creation failed:', error);
    throw new Error(
      `Failed to create booking on blockchain: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Cancel a booking on the blockchain
 * @param bookingId - Booking ID to cancel
 * @param userId - User ID requesting cancellation
 * @returns Success boolean
 */
export async function cancelBooking(bookingId: string, userId: string): Promise<boolean> {
  if (useMock) {
    return mockBookingContract.cancelBooking(bookingId, userId);
  }

  try {
    const contract = new Contract(contractId);

    const bookingIdScVal = nativeToScVal(Number.parseInt(bookingId, 10), { type: 'u64' });
    const userIdScVal = nativeToScVal(userId, { type: 'string' });

    // Cast to Account type to satisfy TransactionBuilder requirements
    const account = (await server.getAccount(sourceKeypair.publicKey())) as Account;
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    })
      .addOperation(contract.call('cancel_booking', bookingIdScVal, userIdScVal))
      .setTimeout(30)
      .build();

    // Sign the transaction
    tx.sign(sourceKeypair);

    // Submit transaction to the network
    const response = await server.sendTransaction(tx);

    // Handle response
    if (!response.hash) {
      throw new Error('No transaction hash returned');
    }

    // Wait for confirmation if needed
    const txResponse = await waitForTransactionConfirmation(response.hash);

    if (txResponse.status === 'SUCCESS') {
      return true;
    }

    throw new Error(`Transaction failed with status: ${txResponse.status}`);
  } catch (error) {
    console.error('Blockchain booking cancellation failed:', error);
    throw new Error(
      `Failed to cancel booking on blockchain: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Update booking status on the blockchain
 * @param bookingId - Booking ID to update
 * @param newStatus - New status to set
 * @returns Success boolean
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<boolean> {
  if (useMock) {
    return mockBookingContract.updateBookingStatus(bookingId, newStatus);
  }

  try {
    const contract = new Contract(contractId);

    // Map our app's status to contract's status enum
    const contractStatus = mapToContractStatus(newStatus);

    const bookingIdScVal = nativeToScVal(Number.parseInt(bookingId, 10), { type: 'u64' });
    const statusScVal = nativeToScVal(contractStatus, { type: 'u32' }); // Assuming enum is u32 in the contract
    const callerScVal = new Address(sourceKeypair.publicKey()).toScVal();

    // Cast to Account type to satisfy TransactionBuilder requirements
    const account = (await server.getAccount(sourceKeypair.publicKey())) as Account;
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase,
    })
      .addOperation(contract.call('update_status', bookingIdScVal, statusScVal, callerScVal))
      .setTimeout(30)
      .build();

    // Sign the transaction
    tx.sign(sourceKeypair);

    // Submit transaction to the network
    const response = await server.sendTransaction(tx);

    // Handle response
    if (!response.hash) {
      throw new Error('No transaction hash returned');
    }

    // Wait for confirmation if needed
    const txResponse = await waitForTransactionConfirmation(response.hash || '');

    if (txResponse.status === 'SUCCESS') {
      return true;
    }

    throw new Error(`Transaction failed with status: ${txResponse.status}`);
  } catch (error) {
    console.error('Blockchain booking status update failed:', error);
    throw new Error(
      `Failed to update booking status on blockchain: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Map our app's status to the contract's status enum
 */
function mapToContractStatus(status: BookingStatus): number {
  switch (status) {
    case 'pending':
      return 0; // BookingStatus::Pending
    case 'confirmed':
      return 1; // BookingStatus::Confirmed
    case 'completed':
      return 2; // BookingStatus::Completed
    case 'cancelled':
      return 3; // BookingStatus::Cancelled
    default:
      throw new Error(`Unsupported booking status: ${status}`);
  }
}

// Re-export mock helpers for testing
export const { addMockBooking, clearMockBookings } = mockBookingContract;
