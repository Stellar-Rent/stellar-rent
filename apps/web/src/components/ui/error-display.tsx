'use client';

import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  title?: string;
  variant?: 'default' | 'inline' | 'toast';
  className?: string;
}

export const ErrorDisplay = ({
  error,
  onRetry,
  onDismiss,
  title = 'Something went wrong',
  variant = 'default',
  className = '',
}: ErrorDisplayProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (variant === 'toast') {
    return (
      <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
        <div className="bg-red-100 border border-red-200 text-red-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium">{title}</h4>
              <p className="text-sm mt-1">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50"
                >
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
              )}
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="ml-2 text-red-400 hover:text-red-600"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}
      >
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}
    >
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">{title}</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
        )}
      </div>
    </div>
  );
};
