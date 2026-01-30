'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton = ({ className = '' }: LoadingSkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-gray-700/30 rounded-lg ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

// Property card skeleton
export const PropertyCardSkeleton = () => {
  return (
    <div className="rounded-2xl overflow-hidden bg-secondary border border-gray-700/50">
      <LoadingSkeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <LoadingSkeleton className="h-6 w-3/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <LoadingSkeleton className="h-4 w-16" />
          <LoadingSkeleton className="h-4 w-16" />
        </div>
        <LoadingSkeleton className="h-8 w-full" />
      </div>
    </div>
  );
};

// Grid loading state
interface LoadingGridProps {
  count?: number;
  columns?: number;
}

export const LoadingGrid = ({ count = 8, columns = 4 }: LoadingGridProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${columns} gap-8`}>
      {Array.from({ length: count }, () => crypto.randomUUID()).map((id) => (
        <PropertyCardSkeleton key={id} />
      ))}
    </div>
  );
};

// Spinner loader
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner = ({ size = 'md', className = '', label }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]} ${className}`} />
      {label && <span className="text-sm text-gray-400">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Full page loader
interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader = ({ message = 'Loading...' }: FullPageLoaderProps) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <Spinner size="lg" label={message} />
    </div>
  );
};
