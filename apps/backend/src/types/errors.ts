/**
 * Custom Error Classes for StellarRent Backend
 *
 * These error classes provide structured error handling for different
 * domains within the application, enabling better error tracking,
 * logging, and API responses.
 */

/**
 * Error class for escrow-related operations
 */
export class EscrowError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'EscrowError';
  }
}

/**
 * Error class for blockchain synchronization operations
 */
export class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

/**
 * Error class for cache operations
 */
export class CacheError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CacheError';
  }
}
