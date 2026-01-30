'use client';

import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from './button';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'default' | 'destructive' | 'warning';
  className?: string;
}

export const ErrorDisplay = ({
  title = 'Something went wrong',
  message,
  onRetry,
  variant = 'destructive',
  className = '',
}: ErrorDisplayProps) => {
  const variantStyles = {
    default: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
    destructive: 'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  };

  const Icon = variant === 'warning' ? AlertCircle : XCircle;

  return (
    <div
      className={`rounded-xl border p-6 ${variantStyles[variant]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm opacity-90">{message}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-4 gap-2 border-current text-current hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline error variant for smaller spaces
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const InlineError = ({ message, onRetry, className = '' }: InlineErrorProps) => {
  return (
    <div className={`flex items-center gap-2 text-red-400 text-sm ${className}`} role="alert">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 underline hover:text-red-300 transition-colors"
          type="button"
        >
          Retry
        </button>
      )}
    </div>
  );
};
