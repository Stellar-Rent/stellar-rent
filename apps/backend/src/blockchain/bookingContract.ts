import * as StellarSdk from '@stellar/stellar-sdk';
import * as mockBookingContract from '../__mocks__/bookingContract';
import { getSorobanConfig } from './config';
import {
  buildTransaction,
  submitAndConfirmTransaction,
  retryOperation,
  simulateTransaction,
} from './transactionUtils';
import { classifyError, ContractError } from './errors';

export async function checkBookingAvailability(
  propertyId: string,
  from: string,
  to: string
): Promise<boolean> {
  const config = getSorobanConfig();

  if (config.useMock) {
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
    return await retryOperation(
      async () => {
        const contract = new StellarSdk.Contract(config.contractIds.booking);

        const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
        const startDateScVal = StellarSdk.nativeToScVal(startDate, { type: 'i64' });
        const endDateScVal = StellarSdk.nativeToScVal(endDate, { type: 'i64' });

        const operation = contract.call(
          'check_availability',
          propertyIdScVal,
          startDateScVal,
          endDateScVal
        );

        const tx = await buildTransaction(operation, config, {
          fee: config.fees.default,
        });

        const available = await simulateTransaction(tx, config.rpcServer);

        // Fail open: if result is undefined/null, assume available
        if (available === undefined || available === null) {
          return true;
        }
        return Boolean(available);
      },
      config
    );
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
  const config = getSorobanConfig();

  if (config.useMock) {
    // Generate a mock booking ID for testing
    return `mock-booking-${Date.now()}`;
  }

  try {
    return await retryOperation(
      async () => {
        const contract = new StellarSdk.Contract(config.contractIds.booking);

        const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
        const guestIdScVal = StellarSdk.nativeToScVal(guestId, { type: 'string' });
        const fromScVal = StellarSdk.nativeToScVal(fromTimestamp, { type: 'i64' });
        const toScVal = StellarSdk.nativeToScVal(toTimestamp, { type: 'i64' });
        const amountScVal = StellarSdk.nativeToScVal(totalAmount, { type: 'string' });
        const guestsScVal = StellarSdk.nativeToScVal(guests, { type: 'u32' });

        const operation = contract.call(
          'create_booking',
          propertyIdScVal,
          guestIdScVal,
          fromScVal,
          toScVal,
          amountScVal,
          guestsScVal
        );

        const tx = await buildTransaction(operation, config, {
          fee: config.fees.booking,
        });

        tx.sign(config.sourceKeypair);

        const result = await submitAndConfirmTransaction(tx, config.rpcServer, config);

        if (result.status === 'SUCCESS') {
          // Return booking ID from contract return value, or transaction hash as fallback
          return result.returnValue || result.hash;
        }

        throw new ContractError(
          `Transaction failed with status: ${result.status}`,
          config.contractIds.booking
        );
      },
      config
    );
  } catch (error) {
    console.error('Blockchain booking creation failed:', error);
    throw classifyError(error);
  }
}

export async function cancelBookingOnChain(
  propertyId: string,
  bookingId: string,
  requestorId: string
): Promise<boolean> {
  const config = getSorobanConfig();

  if (config.useMock) {
    return true;
  }

  try {
    return await retryOperation(
      async () => {
        const contract = new StellarSdk.Contract(config.contractIds.booking);

        const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
        const bookingIdScVal = StellarSdk.nativeToScVal(bookingId, { type: 'string' });
        const requestorIdScVal = StellarSdk.nativeToScVal(requestorId, { type: 'string' });

        const operation = contract.call(
          'cancel_booking',
          propertyIdScVal,
          bookingIdScVal,
          requestorIdScVal
        );

        const tx = await buildTransaction(operation, config, {
          fee: config.fees.booking,
        });

        tx.sign(config.sourceKeypair);

        const result = await submitAndConfirmTransaction(tx, config.rpcServer, config);

        return result.status === 'SUCCESS';
      },
      config
    );
  } catch (error) {
    console.error('Blockchain booking cancellation failed:', error);
    throw classifyError(error);
  }
}

export async function updateBookingStatusOnChain(
  propertyId: string,
  bookingId: string,
  newStatus: string,
  requestorId: string
): Promise<boolean> {
  const config = getSorobanConfig();

  if (config.useMock) {
    return true;
  }

  try {
    return await retryOperation(
      async () => {
        const contract = new StellarSdk.Contract(config.contractIds.booking);

        const propertyIdScVal = StellarSdk.nativeToScVal(propertyId, { type: 'string' });
        const bookingIdScVal = StellarSdk.nativeToScVal(bookingId, { type: 'string' });
        const statusScVal = StellarSdk.nativeToScVal(newStatus, { type: 'string' });
        const requestorIdScVal = StellarSdk.nativeToScVal(requestorId, { type: 'string' });

        const operation = contract.call(
          'update_status',
          propertyIdScVal,
          bookingIdScVal,
          statusScVal,
          requestorIdScVal
        );

        const tx = await buildTransaction(operation, config, {
          fee: config.fees.booking,
        });

        tx.sign(config.sourceKeypair);

        const result = await submitAndConfirmTransaction(tx, config.rpcServer, config);

        return result.status === 'SUCCESS';
      },
      config
    );
  } catch (error) {
    console.error('Blockchain booking status update failed:', error);
    throw classifyError(error);
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
