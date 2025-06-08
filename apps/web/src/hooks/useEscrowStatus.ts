'use client';

import type { EscrowData, EscrowStatus, UseEscrowStatusReturn } from '@/types/booking';
import { useCallback, useEffect, useState } from 'react';

// Constants for timing consistency
const PENDING_TO_CONFIRMED_MINUTES = 5;
const POLLING_INTERVAL_DEFAULT = 10000;

export function useEscrowStatus(
  bookingId: string,
  initialStatus: EscrowStatus = 'pending',
  pollingInterval = POLLING_INTERVAL_DEFAULT
): UseEscrowStatusReturn {
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrowStatus = useCallback(async () => {
    try {
      setError(null);

      await new Promise((resolve) => setTimeout(resolve, 500));
      const now = new Date();

      // Generate more realistic mock data
      const mockData: EscrowData = {
        status: initialStatus,
        transactionHash: `0x${bookingId.toLowerCase().padEnd(32, '0')}`,
        amount: Math.floor(Math.random() * 1000) + 500, // Random amount between 500-1500
        lastUpdated: now,
        estimatedConfirmationTime: new Date(
          now.getTime() + PENDING_TO_CONFIRMED_MINUTES * 60 * 1000
        ),
      };

      setEscrowData((prevData) => {
        if (prevData) {
          const timeSinceLastUpdate = now.getTime() - prevData.lastUpdated.getTime();
          const minutesSinceUpdate = timeSinceLastUpdate / (1000 * 60);

          if (prevData.status === 'pending' && minutesSinceUpdate > PENDING_TO_CONFIRMED_MINUTES) {
            mockData.status = 'confirmed';
            mockData.estimatedConfirmationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          } else {
            mockData.status = prevData.status;
            mockData.estimatedConfirmationTime = prevData.estimatedConfirmationTime;
          }
        }
        return mockData;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch escrow status');
    } finally {
      setLoading(false);
    }
  }, [initialStatus, bookingId]);

  const refetch = async () => {
    setLoading(true);
    await fetchEscrowStatus();
  };

  // Initial fetch
  useEffect(() => {
    fetchEscrowStatus();
  }, [fetchEscrowStatus]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!escrowData || escrowData.status === 'completed' || escrowData.status === 'cancelled') {
      return;
    }

    const interval = setInterval(() => {
      fetchEscrowStatus();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [fetchEscrowStatus, pollingInterval, escrowData]);

  return {
    escrowData,
    loading,
    error,
    refetch,
  };
}

export function getEscrowStatusInfo(status: EscrowStatus) {
  switch (status) {
    case 'pending':
      return {
        label: 'Payment Pending',
        description: 'Your payment is being processed',
        color: 'yellow',
        progress: 25,
      };
    case 'confirmed':
      return {
        label: 'Payment Secured',
        description: 'Funds are safely held in escrow',
        color: 'blue',
        progress: 75,
      };
    case 'completed':
      return {
        label: 'Payment Released',
        description: 'Payment has been released to the host',
        color: 'green',
        progress: 100,
      };
    case 'cancelled':
      return {
        label: 'Payment Refunded',
        description: 'Your payment has been refunded',
        color: 'red',
        progress: 0,
      };
  }
}

export function getEstimatedTimeToNextStatus(
  currentStatus: EscrowStatus,
  lastUpdated: Date
): string | null {
  const now = new Date();
  const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
  const minutesSinceUpdate = timeSinceUpdate / (1000 * 60);

  switch (currentStatus) {
    case 'pending': {
      const remainingMinutes = Math.max(0, PENDING_TO_CONFIRMED_MINUTES - minutesSinceUpdate);
      if (remainingMinutes > 0) {
        return `~${Math.ceil(remainingMinutes)} minutes until confirmation`;
      }
      return 'Confirmation expected soon';
    }

    case 'confirmed':
      return 'Payment will be released after your stay';

    default:
      return null;
  }
}
