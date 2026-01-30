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
      if (!bookingId || !isValidBookingId(bookingId)) {
        throw new Error('Invalid booking ID');
      }

      const response = await fetch(`/api/bookings/${bookingId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Booking not found');
        }
        throw new Error(`Failed to fetch booking: ${response.statusText}`);
      }

      const data = await response.json();

      // Ensure the response matches our expected BookingData type
      const booking: BookingData = {
        id: data.id || bookingId,
        property: {
          title: data.property?.title || 'Unknown Property',
          image: data.property?.image || '/images/property-placeholder.webp',
        },
        dates: {
          from: data.dates?.from ? new Date(data.dates.from) : new Date(),
          to: data.dates?.to ? new Date(data.dates.to) : new Date(),
        },
        guests: data.guests || 1,
        totalAmount: data.totalAmount || 0,
        transactionHash: data.transactionHash || `0x${bookingId.toLowerCase().padEnd(32, '0')}`,
        escrowStatus: data.escrowStatus || 'pending',
        host: {
          name: data.host?.name || 'Host',
          email: data.host?.email || '',
          phone: data.host?.phone || '',
        },
      };

      setBookingData(booking);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load booking data';
      setError(errorMessage);
      setBookingData(null);
      console.error('Error fetching booking data:', err);
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
