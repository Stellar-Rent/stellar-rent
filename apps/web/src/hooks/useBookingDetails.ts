'use client';

import { useCallback, useEffect, useState } from 'react';

interface BookingData {
  id: string;
  property: {
    title: string;
    image: string;
  };
  dates: {
    from: Date;
    to: Date;
  };
  guests: number;
  totalAmount: number;
  transactionHash: string;
  escrowStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  host: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface UseBookingDetailsReturn {
  bookingData: BookingData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBookingDetails(bookingId: string): UseBookingDetailsReturn {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate booking ID
      if (!bookingId || bookingId.length < 3) {
        throw new Error('Invalid booking ID');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockData: BookingData = {
        id: bookingId,
        property: {
          title: 'Luxury Beachfront Villa',
          image: '/images/property-placeholder.jpg',
        },
        dates: {
          from: new Date('2024-03-15'),
          to: new Date('2024-03-20'),
        },
        guests: 2,
        totalAmount: 750,
        transactionHash: 'ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ',
        escrowStatus: 'pending',
        host: {
          name: 'John Smith',
          email: 'john.smith@example.com',
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

export function isValidBookingId(bookingId: string): boolean {
  return bookingId && bookingId.length >= 3 && /^[A-Za-z0-9]+$/.test(bookingId);
}

export function formatBookingId(bookingId: string): string {
  return bookingId.toUpperCase();
}
