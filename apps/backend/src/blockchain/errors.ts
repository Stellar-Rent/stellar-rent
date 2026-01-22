/**
 * Base error class for all blockchain-related errors
 */
export class BlockchainError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'BlockchainError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Network-related errors (timeouts, connection issues)
 * These are typically retryable
 */
export class NetworkError extends BlockchainError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'NetworkError';
  }
}

/**
 * Smart contract execution errors
 * These are typically NOT retryable (logic errors, invalid params)
 */
export class ContractError extends BlockchainError {
  constructor(
    message: string,
    public readonly contractId?: string,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'ContractError';
  }
}

/**
 * Transaction failed error with transaction hash
 */
export class TransactionFailedError extends BlockchainError {
  constructor(
    message: string,
    public readonly txHash?: string,
    public readonly status?: string,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'TransactionFailedError';
  }
}

/**
 * Transaction timeout error
 * Retryable if it's a confirmation timeout
 */
export class TransactionTimeoutError extends BlockchainError {
  constructor(
    message: string,
    public readonly txHash?: string,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'TransactionTimeoutError';
  }
}

/**
 * Configuration error (missing env vars, invalid config)
 * These are NOT retryable
 */
export class ConfigurationError extends BlockchainError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ConfigurationError';
  }
}

/**
 * Simulation error (contract simulation failed)
 * May be retryable depending on the cause
 */
export class SimulationError extends BlockchainError {
  constructor(
    message: string,
    public readonly simulationResult?: any,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'SimulationError';
  }
}

/**
 * Determine if an error is retryable
 * Network errors and timeouts are retryable
 * Contract errors and configuration errors are not
 */
export function isRetryableError(error: Error): boolean {
  // Network errors are always retryable
  if (error instanceof NetworkError) {
    return true;
  }

  // Transaction timeouts are retryable (might confirm later)
  if (error instanceof TransactionTimeoutError) {
    return true;
  }

  // Contract errors are not retryable (logic error)
  if (error instanceof ContractError) {
    return false;
  }

  // Configuration errors are not retryable
  if (error instanceof ConfigurationError) {
    return false;
  }

  // Transaction failed with permanent status
  if (error instanceof TransactionFailedError) {
    // If it's a FAILED status, don't retry
    if (error.status === 'FAILED' || error.status === 'ERROR') {
      return false;
    }
    // Other statuses might be retryable
    return true;
  }

  // Simulation errors might be retryable
  if (error instanceof SimulationError) {
    // Check if it's a network issue vs contract issue
    const message = error.message.toLowerCase();
    if (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection')
    ) {
      return true;
    }
    return false;
  }

  // Check error message for common retryable patterns
  const message = error.message.toLowerCase();
  const retryablePatterns = [
    'timeout',
    'network',
    'connection',
    'econnrefused',
    'enotfound',
    'etimedout',
    'rate limit',
    'too many requests',
    'service unavailable',
    'gateway timeout',
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

/**
 * Extract a user-friendly error message from a blockchain error
 */
export function getErrorMessage(error: Error): string {
  if (error instanceof TransactionFailedError) {
    return `Transaction failed${error.txHash ? ` (${error.txHash.substring(0, 8)}...)` : ''}`;
  }

  if (error instanceof ContractError) {
    return `Contract error${error.contractId ? ` in ${error.contractId.substring(0, 8)}...` : ''}: ${error.message}`;
  }

  if (error instanceof NetworkError) {
    return `Network error: ${error.message}`;
  }

  if (error instanceof TransactionTimeoutError) {
    return `Transaction timed out${error.txHash ? ` (${error.txHash.substring(0, 8)}...)` : ''}`;
  }

  if (error instanceof ConfigurationError) {
    return `Configuration error: ${error.message}`;
  }

  if (error instanceof SimulationError) {
    return `Simulation error: ${error.message}`;
  }

  return error.message || 'Unknown blockchain error';
}

/**
 * Classify an error based on its type and message
 * Returns a standardized error object
 */
export function classifyError(error: unknown): BlockchainError {
  if (error instanceof BlockchainError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network-related errors
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused')
    ) {
      return new NetworkError(error.message, error);
    }

    // Contract-related errors
    if (
      message.includes('contract') ||
      message.includes('invoke') ||
      message.includes('simulation')
    ) {
      return new ContractError(error.message, undefined, error);
    }

    // Configuration errors
    if (message.includes('configuration') || message.includes('environment')) {
      return new ConfigurationError(error.message, error);
    }

    // Default to generic blockchain error
    return new BlockchainError(error.message, error);
  }

  // Unknown error type
  return new BlockchainError(
    typeof error === 'string' ? error : 'Unknown error occurred'
  );
}
