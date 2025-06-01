'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useWallet } from '@/hooks/useWallet';
import { format } from 'date-fns';
import { WalletConnectionModal } from '@/components/booking/WalletConnectionModal';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { useRouter } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import { processPayment } from '@/lib/stellar';
import { toast } from 'react-hot-toast';
import { BookingForm } from '@/components/booking/BookingForm';

interface BookingPageProps {
  params: {
    propertyId: string;
  };
}

export default function BookingPage({ params }: BookingPageProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { isConnected, connect, publicKey } = useWallet();
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [guests, setGuests] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    bookingId: string;
    transactionHash: string;
  } | null>(null);
  const [bookingStep, setBookingStep] = useState<'form' | 'confirmation'>('form');
  const [bookingData, setBookingData] = useState<{
    property: { title: string; image: string };
    dates: { from: Date; to: Date };
    guests: number;
    totalAmount: number;
    transactionHash: string;
  } | null>(null);

  // Mock property data - replace with actual data fetching
  const property = {
    id: params.propertyId,
    title: 'Luxury Beachfront Villa',
    image: '/images/property-placeholder.jpg',
    pricePerNight: 150,
    deposit: 500,
    commission: 0.00001,
    hostWallet: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ', // Mock host wallet
  };

  const calculateTotal = () => {
    if (!selectedDates?.from || !selectedDates?.to) return 0;
    const nights = Math.ceil(
      (selectedDates.to.getTime() - selectedDates.from.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return nights * property.pricePerNight + property.deposit;
  };

  const handlePayment = async () => {
    if (!isConnected || !publicKey) {
      setShowWalletModal(true);
      return;
    }

    if (!selectedDates?.from || !selectedDates?.to) {
      toast.error('Please select dates first');
      return;
    }

    try {
      setIsProcessing(true);
      const total = calculateTotal();
      
      // Process payment using Stellar
      const transactionHash = await processPayment(
        publicKey,
        property.hostWallet,
        total.toString()
      );
      
      const bookingId = `BK${Math.random().toString(36).substr(2, 9)}`;
      
      setBookingDetails({
        bookingId,
        transactionHash,
      });
      setBookingComplete(true);
      toast.success('Payment successful!');
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBookingSubmit = async (data: {
    property: { title: string; image: string };
    dates: { from: Date; to: Date };
    guests: number;
    totalAmount: number;
  }) => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }

    try {
      // Process payment using Stellar
      const transactionHash = await processPayment(
        publicKey!,
        'GCO2IP3MJNUOKS4PUDI4C7LGGMQDJGXG3COYX3WSB4HHNAHKYV5YL3VC', // Host's public key
        data.totalAmount.toString()
      );

      // Update booking data with transaction hash
      setBookingData({
        ...data,
        transactionHash,
      });

      // Move to confirmation step
      setBookingStep('confirmation');
    } catch (error) {
      console.error('Error processing booking:', error);
      // Handle error (show error message to user)
    }
  };

  if (bookingComplete && bookingDetails && selectedDates?.from && selectedDates?.to) {
    return (
      <BookingConfirmation
        bookingId={bookingDetails.bookingId}
        property={property}
        dates={{
          from: selectedDates.from,
          to: selectedDates.to,
        }}
        guests={guests}
        totalAmount={calculateTotal()}
        transactionHash={bookingDetails.transactionHash}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        {bookingStep === 'form' ? (
          <BookingForm onSubmit={handleBookingSubmit} />
        ) : (
          bookingData && (
            <BookingConfirmation
              bookingId="123" // Replace with actual booking ID
              property={bookingData.property}
              dates={bookingData.dates}
              guests={bookingData.guests}
              totalAmount={bookingData.totalAmount}
              transactionHash={bookingData.transactionHash}
            />
          )
        )}

        <WalletConnectionModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      </div>
    </div>
  );
} 