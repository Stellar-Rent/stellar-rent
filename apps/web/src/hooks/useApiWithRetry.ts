import { useError } from '@/contexts/ErrorContext';
import { handleAPIError } from '@/services/api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  retryOnce: () => Promise<void>;
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

  const { addError } = useError();
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const activeSeqRef = useRef(0);
  const retryRef = useRef<() => Promise<void>>(async () => {});
  const isRetryingRef = useRef(false);
  const pendingRetryRef = useRef<Promise<void> | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const retryConfig = useMemo(() => ({ ...DEFAULT_RETRY_CONFIG, ...config }), [config]);

  const executeWithRetry = useCallback(
    async (args: unknown[]): Promise<T | null> => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Increment sequence and set as active
      requestSeqRef.current += 1;
      const currentSeq = requestSeqRef.current;
      activeSeqRef.current = currentSeq;

      let attemptsMade = 0;

      // Debounced loading state to prevent flickering
      const setLoadingDebounced = (loading: boolean) => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        if (loading) {
          // Set loading immediately
          if (currentSeq === activeSeqRef.current) {
            setIsLoading(true);
          }
        } else {
          // Delay setting loading to false to prevent flickering
          loadingTimeoutRef.current = setTimeout(() => {
            if (currentSeq === activeSeqRef.current) {
              setIsLoading(false);
            }
          }, 100);
        }
      };

      // Set loading state only if this is still the active request
      if (currentSeq === activeSeqRef.current) {
        setLoadingDebounced(true);
        setError(null);
      }

      while (attemptsMade < retryConfig.maxRetries) {
        // Check if request was cancelled
        if (currentSeq !== activeSeqRef.current || controller.signal.aborted) {
          return null;
        }

        try {
          const result = await apiFunction(...args);

          // Double-check sequence before updating state
          if (currentSeq !== activeSeqRef.current) {
            return null;
          }

          setData(result);
          setLoadingDebounced(false);
          return result;
        } catch (err) {
          attemptsMade += 1;

          const hasMoreAttempts = attemptsMade < retryConfig.maxRetries;
          const canRetry = hasMoreAttempts && retryConfig.retryCondition(err);

          if (canRetry) {
            const delayMs = retryConfig.retryDelay * 2 ** (attemptsMade - 1);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          // Final error - no more retries
          const errorMessage = handleAPIError(err);

          // Only update state if this is still the active request
          if (currentSeq === activeSeqRef.current) {
            setError(errorMessage);
            setLoadingDebounced(false);

            // Add error notification with proper retry handling
            addError({
              message: errorMessage,
              title: 'API Request Failed',
              variant: 'toast',
              retryable: true,
              onRetry: async () => {
                // Prevent multiple simultaneous retries
                if (isRetryingRef.current) {
                  return;
                }

                isRetryingRef.current = true;

                try {
                  // Wait for any pending retry to complete
                  if (pendingRetryRef.current) {
                    await pendingRetryRef.current;
                  }

                  // Create new retry promise and wait for it
                  pendingRetryRef.current = retryRef.current();
                  await pendingRetryRef.current;
                } finally {
                  isRetryingRef.current = false;
                  pendingRetryRef.current = null;
                }
              },
            });
          }

          return null;
        }
      }

      return null;
    },
    [apiFunction, retryConfig, addError]
  );

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLastArgs(args);
      return executeWithRetry(args);
    },
    [executeWithRetry]
  );

  const retry = useCallback(async () => {
    if (lastArgs !== null && !isRetryingRef.current) {
      isRetryingRef.current = true;

      try {
        // Clear any existing error before retrying
        setError(null);
        await executeWithRetry(lastArgs);
      } finally {
        isRetryingRef.current = false;
      }
    }
  }, [lastArgs, executeWithRetry]);

  useEffect(() => {
    retryRef.current = retry;
  }, [retry]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  const retryOnce = useCallback(async () => {
    if (lastArgs !== null && !isRetryingRef.current) {
      isRetryingRef.current = true;

      // Capture sequence value after incrementing to avoid TOCTOU
      const seq = requestSeqRef.current + 1;
      requestSeqRef.current = seq;
      activeSeqRef.current = seq;

      try {
        setIsLoading(true);
        setError(null);

        const result = await apiFunction(...lastArgs);

        // Only update if this is still the active sequence
        if (activeSeqRef.current === seq) {
          setData(result);
          setIsLoading(false);
        }
      } catch (singleRetryError) {
        const singleRetryErrorMessage = handleAPIError(singleRetryError);

        // Only update if this is still the active sequence (use captured seq)
        if (activeSeqRef.current === seq) {
          setError(singleRetryErrorMessage);
          setIsLoading(false);
        }
      } finally {
        isRetryingRef.current = false;
      }
    }
  }, [lastArgs, apiFunction]);

  const reset = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any pending timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setData(null);
    setError(null);
    setIsLoading(false);
    setLastArgs(null);
    isRetryingRef.current = false;
    pendingRetryRef.current = null;
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    retry,
    retryOnce,
    reset,
  };
};
