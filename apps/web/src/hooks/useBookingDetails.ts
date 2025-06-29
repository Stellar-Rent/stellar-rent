'use client';

import type { BookingData, UseBookingDetailsReturn } from '@/types/booking';
import { useCallback, useEffect, useState } from 'react';

// Validation function for booking IDs
function isValidBookingId(bookingId: string): boolean {
  return bookingId && bookingId.length >= 3 && /^[a-zA-Z0-9-_]+$/.test(bookingId);
}

export function useBookingDetails(bookingId: string): UseBookingDetailsReturn {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(() => isValidBookingId(bookingId));
  const [error, setError] = useState<string | null>(null);

  // Early validation
  useEffect(() => {
    if (!isValidBookingId(bookingId)) {
      setError('Invalid booking ID');
      setLoading(false);
      setBookingData(null);
      return;
    }
  }, [bookingId]);

  const fetchBookingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate booking ID
      if (!bookingId || bookingId.length < 3) {
        throw new Error('Invalid booking ID');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Generate more realistic and dynamic mock data
      const mockData: BookingData = {
        id: bookingId,
        property: {
          title: `Property ${bookingId.slice(-3)}`,
          image: '/images/property-placeholder.jpg',
        },
        dates: {
          from: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          to: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        },
        guests: 2,
        totalAmount: 750,
        transactionHash: `0x${bookingId.toLowerCase().padEnd(32, '0')}`,
        escrowStatus: 'pending',
        host: {
          name: `Host ${bookingId.slice(-2)}`,
          email: `host-${bookingId.toLowerCase()}@example.com`,
          phone: '+1 (555) 123-4567',
        },
      };

      setBookingData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking data');
      setBookingData(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const refetch = async () => {
    await fetchBookingData();
  };

  useEffect(() => {
    fetchBookingData();
  }, [fetchBookingData]);

  return {
    bookingData,
    loading,
    error,
    refetch,
  };
}

// Remove duplicate function - it's already defined above

export function formatBookingId(bookingId: string): string {
  return bookingId.toUpperCase();
}
