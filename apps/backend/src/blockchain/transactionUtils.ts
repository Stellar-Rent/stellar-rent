import {
  Transaction,
  TransactionBuilder,
  Keypair,
  xdr,
  scValToNative,
} from '@stellar/stellar-sdk';
import type { Server as SorobanRpcServer } from '@stellar/stellar-sdk/rpc';
import type { SorobanConfig } from './config';
import {
  NetworkError,
  TransactionFailedError,
  TransactionTimeoutError,
  SimulationError,
  isRetryableError,
  classifyError,
} from './errors';

export interface TransactionOptions {
  fee?: string;
  timeout?: number;
  memo?: string;
}

export interface TransactionResult {
  hash: string;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  returnValue?: any;
  error?: string;
  ledger?: number;
}

/**
 * Get recommended fee from network statistics
 * Falls back to configured fee if unable to fetch stats
 */
export async function getRecommendedFee(
  server: SorobanRpcServer,
  fallbackFee: string
): Promise<string> {
  try {
    // Try to get fee stats from the network
    const feeStats = await server.getFeeStats();

    if (feeStats && feeStats.sorobanInclusionFee) {
      // Use the median fee as recommended
      const medianFee = feeStats.sorobanInclusionFee.med;
      // Add 20% buffer for better inclusion probability
      const recommendedFee = Math.ceil(Number(medianFee) * 1.2).toString();
      return recommendedFee;
    }
  } catch (error) {
    console.warn('Failed to fetch network fee stats, using fallback fee:', error);
  }

  // Fallback to configured fee
  return fallbackFee;
}

/**
 * Build a transaction with proper fee and configuration
 */
export async function buildTransaction(
  operation: xdr.Operation,
  config: SorobanConfig,
  options?: TransactionOptions
): Promise<Transaction> {
  try {
    // Get the source account
    const account = await config.rpcServer.getAccount(
      config.sourceKeypair.publicKey()
    );

    // Determine the fee to use
    let fee = options?.fee || config.fees.default;
    if (!options?.fee) {
      // Try to get dynamic fee recommendation
      fee = await getRecommendedFee(config.rpcServer, config.fees.default);
    }

    // Build the transaction
    const txBuilder = new TransactionBuilder(account, {
      fee,
      networkPassphrase: config.networkPassphrase,
    }).addOperation(operation);

    // Set timeout
    const timeout = options?.timeout || config.timeouts.transaction;
    txBuilder.setTimeout(timeout);

    // Add memo if provided
    if (options?.memo) {
      // Could add memo support here if needed
    }

    return txBuilder.build();
  } catch (error) {
    throw classifyError(error);
  }
}

/**
 * Poll for transaction confirmation on Horizon
 */
async function pollForConfirmation(
  txHash: string,
  config: SorobanConfig,
  startTime: number
): Promise<{ confirmed: boolean; ledger?: number }> {
  const maxWaitTime = config.timeouts.confirmation;
  const pollInterval = 2000; // Poll every 2 seconds

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Try to get transaction from Horizon
      const tx = await config.horizonServer
        .transactions()
        .transaction(txHash)
        .call();

      if (tx) {
        return {
          confirmed: tx.successful,
          ledger: tx.ledger_attr,
        };
      }
    } catch (error: any) {
      // 404 means transaction not yet confirmed, keep polling
      if (error?.response?.status === 404) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        continue;
      }

      // Other errors should be thrown
      throw new NetworkError(
        `Error polling for transaction confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  // Timeout
  return { confirmed: false };
}

/**
 * Submit transaction and wait for confirmation
 */
export async function submitAndConfirmTransaction(
  tx: Transaction,
  server: SorobanRpcServer,
  config: SorobanConfig
): Promise<TransactionResult> {
  const startTime = Date.now();

  try {
    // Send the transaction
    const sendResult = await server.sendTransaction(tx);

    // Check immediate result
    if (sendResult.status === 'ERROR' || sendResult.status === 'FAILED') {
      throw new TransactionFailedError(
        `Transaction failed with status: ${sendResult.status}`,
        sendResult.hash,
        sendResult.status
      );
    }

    const txHash = sendResult.hash;

    // Poll for confirmation
    const confirmationResult = await pollForConfirmation(
      txHash,
      config,
      startTime
    );

    if (!confirmationResult.confirmed) {
      throw new TransactionTimeoutError(
        'Transaction confirmation timed out',
        txHash
      );
    }

    // Get the transaction result to extract return value
    let returnValue: any = undefined;
    try {
      const txResult = await server.getTransaction(txHash);

      if (
        txResult.status === 'SUCCESS' &&
        txResult.resultMetaXdr
      ) {
        // Parse the result to get return value
        const meta = xdr.TransactionMeta.fromXDR(
          txResult.resultMetaXdr,
          'base64'
        );

        // Extract return value from the transaction result
        if (
          meta.switch() === 3 &&
          meta.v3().sorobanMeta() &&
          meta.v3().sorobanMeta()?.returnValue()
        ) {
          const scVal = meta.v3().sorobanMeta()?.returnValue();
          if (scVal) {
            returnValue = scValToNative(scVal);
          }
        }
      }
    } catch (error) {
      // If we can't get the return value, that's ok - continue
      console.warn('Could not extract return value from transaction:', error);
    }

    return {
      hash: txHash,
      status: 'SUCCESS',
      returnValue,
      ledger: confirmationResult.ledger,
    };
  } catch (error) {
    if (
      error instanceof TransactionFailedError ||
      error instanceof TransactionTimeoutError
    ) {
      throw error;
    }

    throw classifyError(error);
  }
}

/**
 * Simulate a transaction and return the result
 * Used for read-only contract calls
 */
export async function simulateTransaction(
  tx: Transaction,
  server: SorobanRpcServer
): Promise<any> {
  try {
    const simulation = await server.simulateTransaction(tx);

    // Check if simulation was successful
    if ('error' in simulation) {
      throw new SimulationError(
        `Transaction simulation failed: ${simulation.error}`,
        simulation
      );
    }

    if (!('result' in simulation) || !simulation.result) {
      throw new SimulationError(
        'No result returned from contract simulation',
        simulation
      );
    }

    // Parse the return value
    const returnValue = simulation.result.retval;
    if (returnValue) {
      return scValToNative(returnValue);
    }

    return null;
  } catch (error) {
    if (error instanceof SimulationError) {
      throw error;
    }
    throw classifyError(error);
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: SorobanConfig,
  errorHandler?: (error: Error) => boolean
): Promise<T> {
  const maxAttempts = config.retries.maxAttempts;
  const baseDelay = config.retries.delayMs;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const shouldRetry = errorHandler
        ? errorHandler(lastError)
        : isRetryableError(lastError);

      // If not retryable or last attempt, throw
      if (!shouldRetry || attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000; // Add up to 1s jitter
      const totalDelay = delay + jitter;

      console.warn(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(totalDelay)}ms:`,
        lastError.message
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Operation failed after retries');
}

/**
 * Helper to extract error details from a failed transaction
 */
export function extractErrorDetails(error: unknown): {
  message: string;
  isRetryable: boolean;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      isRetryable: isRetryableError(error),
    };
  }

  return {
    message: String(error),
    isRetryable: false,
  };
}
