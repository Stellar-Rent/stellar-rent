import type { Mock } from 'bun:test';
import type { AvailabilityRequest, AvailabilityResponse } from '../blockchain/soroban';
import type { BookingEscrowParams } from '../blockchain/trustlessWork';
import type { Booking } from './booking.types';
import type { TransactionLog } from './common.types';

// Mock types for blockchain services
export interface MockBlockchainServices {
  checkAvailability: Mock<(request: AvailabilityRequest) => Promise<AvailabilityResponse>>;
  createEscrow: Mock<(params: BookingEscrowParams) => Promise<string>>;
  cancelEscrow: Mock<(escrowAddress: string) => Promise<void>>;
}

// Mock types for Supabase responses
export interface MockSupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// Mock types for Supabase client methods
export interface MockSupabaseMethods {
  from: (table: string) => {
    insert: (data: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<MockSupabaseResponse<Booking>>;
      };
    };
  };
}

// Mock types for logging service
export interface MockLoggingService {
  logBlockchainOperation: Mock<(operation: string, details: unknown) => TransactionLog>;
  logBlockchainSuccess: Mock<(log: TransactionLog, result: unknown) => void>;
  logBlockchainError: Mock<(log: TransactionLog, error: unknown) => void>;
}

// Test data types
export interface TestBookingData extends Booking {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  escrowAddress: string;
}

export interface TestErrorData extends Record<string, unknown> {
  message: string;
  code: string;
  details: Record<string, unknown>;
}
