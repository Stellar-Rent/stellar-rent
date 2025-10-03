'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { toast } from 'react-hot-toast';
import { ErrorDisplay } from '~/components/ui/error-display';

interface ErrorState {
  errors: Array<{
    id: string;
    message: string;
    title?: string;
    variant?: 'default' | 'inline' | 'toast';
    timestamp: number;
    retryable?: boolean;
    onRetry?: () => void | Promise<void>;
  }>;
}

type ErrorAction =
  | {
      type: 'ADD_ERROR';
      payload: Omit<ErrorState['errors'][0], 'id' | 'timestamp'> & { id?: string };
    }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'UPDATE_ERROR'; payload: { id: string; updates: Partial<ErrorState['errors'][0]> } };

const ErrorContext = createContext<{
  state: ErrorState;
  addError: (error: Omit<ErrorState['errors'][0], 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearAllErrors: () => void;
  updateError: (id: string, updates: Partial<ErrorState['errors'][0]>) => void;
} | null>(null);

const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [
          ...state.errors,
          {
            ...action.payload,
            id:
              action.payload.id || `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          },
        ],
      };
    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter((error) => error.id !== action.payload),
      };
    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: [],
      };
    case 'UPDATE_ERROR':
      return {
        ...state,
        errors: state.errors.map((error) =>
          error.id === action.payload.id ? { ...error, ...action.payload.updates } : error
        ),
      };
    default:
      return state;
  }
};

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, { errors: [] });
  const errorQueueRef = useRef<Array<Omit<ErrorState['errors'][0], 'id' | 'timestamp'>>>([]);
  const isProcessingQueueRef = useRef(false);

  const processErrorQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || errorQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    while (errorQueueRef.current.length > 0) {
      const error = errorQueueRef.current.shift();
      if (!error) continue;

      const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      dispatch({ type: 'ADD_ERROR', payload: { ...error, id: errorId } });

      if (error.variant === 'toast') {
        const toastId = toast.error(
          <div>
            <div className="font-medium">{error.title || 'Error'}</div>
            <div className="text-sm">{error.message}</div>
            {error.retryable && error.onRetry && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await error.onRetry?.();
                    toast.dismiss(toastId);
                  } catch (retryError) {
                    console.error('Retry failed:', retryError);
                  }
                }}
                className="mt-2 text-sm underline hover:text-gray-600"
              >
                Retry
              </button>
            )}
          </div>,
          {
            duration: 8000,
            id: errorId,
            position: 'top-right',
          }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    isProcessingQueueRef.current = false;

    if (errorQueueRef.current.length > 0) {
      processErrorQueue();
    }
  }, []);

  const addError = useCallback(
    (error: Omit<ErrorState['errors'][0], 'id' | 'timestamp'>) => {
      errorQueueRef.current.push(error);
      processErrorQueue();
    },
    [processErrorQueue]
  );

  const removeError = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: id });
    toast.dismiss(id);
  }, []);

  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
    toast.dismiss();
  }, []);

  const updateError = useCallback((id: string, updates: Partial<ErrorState['errors'][0]>) => {
    dispatch({ type: 'UPDATE_ERROR', payload: { id, updates } });
  }, []);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    for (const error of state.errors) {
      const timeout = setTimeout(() => {
        if (errorQueueRef.current.length === 0 && !isProcessingQueueRef.current) {
          removeError(error.id);
        }
      }, 8000);

      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [state.errors, removeError]);

  return (
    <ErrorContext.Provider value={{ state, addError, removeError, clearAllErrors, updateError }}>
      {children}
      {state.errors
        .filter((error) => error.variant !== 'toast')
        .map((error) => (
          <ErrorDisplay
            key={error.id}
            error={error.message}
            title={error.title}
            variant={error.variant || 'default'}
            onRetry={error.retryable ? error.onRetry : undefined}
            onDismiss={() => removeError(error.id)}
          />
        ))}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};
