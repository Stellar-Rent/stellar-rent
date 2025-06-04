'use client';

import { useCallback, useEffect, useState } from 'react';

type EscrowStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface EscrowData {
  status: EscrowStatus;
  transactionHash: string;
  amount: number;
  lastUpdated: Date;
  estimatedConfirmationTime?: Date;
}

interface UseEscrowStatusReturn {
  escrowData: EscrowData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEscrowStatus(
  _bookingId: string,
  initialStatus: EscrowStatus = 'pending',
  pollingInterval = 10000
): UseEscrowStatusReturn {
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrowStatus = useCallback(async () => {
    try {
      setError(null);

      await new Promise((resolve) => setTimeout(resolve, 500));
      const now = new Date();
      const mockData: EscrowData = {
        status: initialStatus,
        transactionHash: 'ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ',
        amount: 750,
        lastUpdated: now,
        estimatedConfirmationTime: new Date(now.getTime() + 5 * 60 * 1000),
      };

      if (escrowData) {
        const timeSinceLastUpdate = now.getTime() - escrowData.lastUpdated.getTime();
        const minutesSinceUpdate = timeSinceLastUpdate / (1000 * 60);

        if (escrowData.status === 'pending' && minutesSinceUpdate > 2) {
          mockData.status = 'confirmed';
          mockData.estimatedConfirmationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else {
          mockData.status = escrowData.status;
          mockData.estimatedConfirmationTime = escrowData.estimatedConfirmationTime;
        }
      }

      setEscrowData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch escrow status');
    } finally {
      setLoading(false);
    }
  }, [initialStatus, escrowData]);

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
      const remainingMinutes = Math.max(0, 5 - minutesSinceUpdate);
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
