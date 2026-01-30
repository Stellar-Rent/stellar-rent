import { useCallback, useState } from 'react';

interface UseApiCallOptions {
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

interface UseApiCallReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: (...args: unknown[]) => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for making API calls with automatic retry logic
 * @param apiFunction - The async function to call
 * @param options - Configuration options for retry behavior
 */
export function useApiCall<T>(
  apiFunction: (...args: unknown[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  const { retryCount = 3, retryDelay = 1000, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastArgs, setLastArgs] = useState<unknown[]>([]);

  const executeWithRetry = useCallback(
    async (args: unknown[], currentRetry = 0): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await apiFunction(...args);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');

        // Retry logic
        if (currentRetry < retryCount) {
          console.log(`Retry attempt ${currentRetry + 1} of ${retryCount}...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return executeWithRetry(args, currentRetry + 1);
        }

        // Max retries reached
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, retryCount, retryDelay, onSuccess, onError]
  );

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLastArgs(args);
      return executeWithRetry(args);
    },
    [executeWithRetry]
  );

  const retry = useCallback(async (): Promise<T | null> => {
    return executeWithRetry(lastArgs);
  }, [executeWithRetry, lastArgs]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    retry,
    reset,
  };
}

/**
 * Utility function to create a retry-enabled API call
 */
export async function retryApiCall<T>(
  apiFunction: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error = new Error('API call failed');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries) {
        console.log(`Retry attempt ${attempt + 1} of ${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
