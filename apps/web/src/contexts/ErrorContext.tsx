'use client';

import { type ReactNode, createContext, useCallback, useContext, useReducer } from 'react';
import { ErrorDisplay } from '~/components/ui/error-display';

interface ErrorState {
  errors: Array<{
    id: string;
    message: string;
    title?: string;
    variant?: 'default' | 'inline' | 'toast';
    timestamp: number;
    retryable?: boolean;
    onRetry?: () => void;
  }>;
}

type ErrorAction =
  | { type: 'ADD_ERROR'; payload: Omit<ErrorState['errors'][0], 'id' | 'timestamp'> }
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
            id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  const addError = useCallback((error: Omit<ErrorState['errors'][0], 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
  }, []);

  const removeError = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: id });
  }, []);

  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, []);

  const updateError = useCallback((id: string, updates: Partial<ErrorState['errors'][0]>) => {
    dispatch({ type: 'UPDATE_ERROR', payload: { id, updates } });
  }, []);

  return (
    <ErrorContext.Provider value={{ state, addError, removeError, clearAllErrors, updateError }}>
      {children}
      {/* Global Error Display */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {state.errors.map((error) => (
          <ErrorDisplay
            key={error.id}
            error={error.message}
            title={error.title}
            variant={error.variant || 'toast'}
            onRetry={error.retryable ? error.onRetry : undefined}
            onDismiss={() => removeError(error.id)}
          />
        ))}
      </div>
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
