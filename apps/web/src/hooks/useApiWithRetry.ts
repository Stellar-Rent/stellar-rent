import { handleAPIError } from '@/services/api';
import { useCallback, useMemo, useState } from 'react';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: unknown) => boolean;
}

interface UseApiWithRetryReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  retry: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Retry on network errors, 5xx errors, and timeouts
    return (
      errorMessage.includes('Network Error') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504')
    );
  },
};

export const useApiWithRetry = <T>(
  apiFunction: (...args: unknown[]) => Promise<T>,
  config: RetryConfig = {}
): UseApiWithRetryReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastArgs, setLastArgs] = useState<unknown[] | null>(null);

  const retryConfig = useMemo(() => ({ ...DEFAULT_RETRY_CONFIG, ...config }), [config]);

  const executeWithRetry = useCallback(
    async (args: unknown[]): Promise<T | null> => {
      let currentRetryCount = 0;

      while (currentRetryCount <= retryConfig.maxRetries) {
        try {
          setIsLoading(true);
          setError(null);

          const result = await apiFunction(...args);
          setData(result);
          return result;
        } catch (err) {
          currentRetryCount++;

          if (currentRetryCount <= retryConfig.maxRetries && retryConfig.retryCondition(err)) {
            // Wait before retrying
            await new Promise((resolve) =>
              setTimeout(resolve, retryConfig.retryDelay * currentRetryCount)
            );
          } else {
            // No more retries or error doesn't qualify for retry
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            break;
          }
        } finally {
          setIsLoading(false);
        }
      }

      return null;
    },
    [apiFunction, retryConfig]
  );

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLastArgs(args);
      return executeWithRetry(args);
    },
    [executeWithRetry]
  );

  const retry = useCallback(async () => {
    if (lastArgs !== null) {
      await executeWithRetry(lastArgs);
    }
  }, [lastArgs, executeWithRetry]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setLastArgs(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    retry,
    reset,
  };
};
