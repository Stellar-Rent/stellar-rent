import {
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  Address,
} from '@stellar/stellar-sdk';
import * as mockBookingContract from '../__mocks__/bookingContract';

// Define the booking status type to match the Soroban contract enum
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

const useMock = process.env.USE_MOCK === 'true';

// Initialize blockchain-related variables
let sourceKeypair: Keypair;
let contractId: string;
let server: SorobanRpc.Server;
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
  server = new SorobanRpc.Server(rpcUrl);
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

    const account = await server.getAccount(sourceKeypair.publicKey());
    const tx = new TransactionBuilder(account, {
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

    const account = await server.getAccount(sourceKeypair.publicKey());
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
    if (response.status === 'PENDING' || response.status === 'SUCCESS') {
      // Wait for confirmation if needed
      const txResponse = await server.getTransaction(response.hash);

      if (txResponse.status === 'SUCCESS') {
        // Extract the booking ID from the result
        const result = txResponse.returnValue;
        if (!result) {
          throw new Error('No booking ID returned from contract');
        }
        
        // Convert XDR result to native JS type (booking ID)
        const scVal = xdr.ScVal.fromXDR(result.xdr, 'base64');
        const bookingId = String(scValToNative(scVal));
        
        return bookingId;
      } else {
        throw new Error(`Transaction failed with status: ${txResponse.status}`);
      }
    } else {
      throw new Error(`Transaction submission failed: ${response.errorResult?.toString() || response.status}`);
    }
  } catch (error) {
    console.error('Blockchain booking creation failed:', error);
    throw new Error(`Failed to create booking on blockchain: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Cancel a booking on the blockchain
 * @param bookingId - Booking ID to cancel
 * @param userId - User ID requesting cancellation
 * @returns Success boolean
 */
export async function cancelBooking(
  bookingId: string,
  userId: string
): Promise<boolean> {
  if (useMock) {
    return mockBookingContract.cancelBooking(bookingId, userId);
  }

  try {
    const contract = new Contract(contractId);

    const bookingIdScVal = nativeToScVal(parseInt(bookingId, 10), { type: 'u64' });
    const userIdScVal = nativeToScVal(userId, { type: 'string' });

    const account = await server.getAccount(sourceKeypair.publicKey());
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
    if (response.status === 'PENDING' || response.status === 'SUCCESS') {
      // Wait for confirmation if needed
      const txResponse = await server.getTransaction(response.hash);

      if (txResponse.status === 'SUCCESS') {
        return true;
      } else {
        throw new Error(`Transaction failed with status: ${txResponse.status}`);
      }
    } else {
      throw new Error(`Transaction submission failed: ${response.errorResult?.toString() || response.status}`);
    }
  } catch (error) {
    console.error('Blockchain booking cancellation failed:', error);
    throw new Error(`Failed to cancel booking on blockchain: ${error instanceof Error ? error.message : String(error)}`);
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
    
    const bookingIdScVal = nativeToScVal(parseInt(bookingId, 10), { type: 'u64' });
    const statusScVal = nativeToScVal(contractStatus, { type: 'u32' }); // Assuming enum is u32 in the contract
    const callerScVal = new Address(sourceKeypair.publicKey()).toScVal();

    const account = await server.getAccount(sourceKeypair.publicKey());
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
    if (response.status === 'PENDING' || response.status === 'SUCCESS') {
      // Wait for confirmation if needed
      const txResponse = await server.getTransaction(response.hash);

      if (txResponse.status === 'SUCCESS') {
        return true;
      } else {
        throw new Error(`Transaction failed with status: ${txResponse.status}`);
      }
    } else {
      throw new Error(`Transaction submission failed: ${response.errorResult?.toString() || response.status}`);
    }
  } catch (error) {
    console.error('Blockchain booking status update failed:', error);
    throw new Error(`Failed to update booking status on blockchain: ${error instanceof Error ? error.message : String(error)}`);
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
