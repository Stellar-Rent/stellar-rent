'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({
  className,
  ...props
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-700', className)}
      {...props}
    />
  );
};

export const PropertyCardSkeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden', className)}
    >
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const SearchBarSkeleton = ({ className }: SkeletonProps) => {
  return (
    <div className={cn('bg-secondary rounded-3xl p-1.5', className)}>
      <div className="flex flex-col lg:flex-row justify-start gap-4">
        {/* Location Field Skeleton */}
        <div className="flex relative group">
          <div className="flex items-center rounded-2xl p-4 gap-3">
            <Skeleton className="w-7 h-7 rounded" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>

        <div className="w-px h-16 bg-gray-600/30 self-center" />

        {/* Date Field Skeleton */}
        <div className="flex relative group">
          <div className="flex items-center rounded-2xl p-4 gap-3">
            <Skeleton className="w-7 h-7 rounded" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>

        <div className="w-px h-16 bg-gray-600/30 self-center" />

        {/* Guests Field Skeleton */}
        <div className="flex relative group">
          <div className="flex items-center rounded-2xl p-4 gap-3">
            <Skeleton className="w-7 h-7 rounded" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        <div className="w-px h-16 bg-gray-600/30 self-center" />

        {/* Search Button Skeleton */}
        <div className="flex items-center">
          <Skeleton className="h-12 w-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export const DashboardStatsSkeleton = ({ className }: SkeletonProps) => {
  const statsItems = Array.from({ length: 4 }, (_, i) => `stats-${i}`);

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {statsItems.map((itemId) => (
        <div key={itemId} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="w-8 h-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({
  rows = 5,
  columns = 4,
  className,
}: SkeletonProps & { rows?: number; columns?: number }) => {
  const headerItems = Array.from({ length: columns }, (_, i) => `header-${i}`);
  const rowItems = Array.from({ length: rows }, (_, i) => `row-${i}`);
  const cellItems = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, colIndex) => `cell-${rowIndex}-${colIndex}`)
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {headerItems.map((itemId) => (
          <Skeleton key={itemId} className="h-4 w-full" />
        ))}
      </div>
      {/* Rows */}
      {rowItems.map((rowId, rowIndex) => (
        <div
          key={rowId}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {cellItems[rowIndex].map((cellId) => (
            <Skeleton key={cellId} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const ListSkeleton = ({ items = 5, className }: SkeletonProps & { items?: number }) => {
  const listItems = Array.from({ length: items }, (_, i) => `list-item-${i}`);

  return (
    <div className={cn('space-y-4', className)}>
      {listItems.map((itemId) => (
        <div
          key={itemId}
          className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg"
        >
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
};
