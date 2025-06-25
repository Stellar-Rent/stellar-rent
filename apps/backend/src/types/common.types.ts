export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface BlockchainError extends Error {
  code: string;
  details?: unknown;
}

export class BookingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BookingError';
  }
}

export interface TransactionLog {
  timestamp: string;
  operation: string;
  status: 'started' | 'completed' | 'failed';
  details: unknown;
  error?: unknown;
}
