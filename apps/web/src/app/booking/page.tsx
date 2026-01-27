'use client';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BookingForm } from '@/components/booking/BookingForm';
import { WalletConnectionModal } from '@/components/booking/WalletConnectionModal';
import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'react-hot-toast';
import PaymentButton from '~/components/payment/paymentButton';
import { bookingAPI } from '~/services/api';

interface BookingPageProps {
  params: {
    propertyId: string;
  };
}

type BookingFlowStep = 'form' | 'payment' | 'confirmation';

export default function BookingPage({ params }: BookingPageProps) {
  const _router = useRouter();
  const { isConnected, connect, publicKey } = useWallet();

  const [_selectedDates, _setSelectedDates] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [_guests, _setGuests] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [_isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingFlowStep>('form');

  const [currentBookingData, setCurrentBookingData] = useState<{
    bookingId: string;
    property: {
      id: string;
      title: string;
      image: string;
      pricePerNight: number;
      deposit: number;
      commission: number;
      hostWallet: string;
    };
    dates: { from: Date; to: Date };
    guests: number;
    totalAmount: number;
    escrowAddress: string;
    transactionHash?: string;
  } | null>(null);

  const _property = {
    id: params.propertyId,
    title: 'Luxury Beachfront Villa',
    image: '/images/property-placeholder.webp',
    pricePerNight: 150,
    deposit: 500,
    commission: 0.00001,
    hostWallet: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
  };

  const handleBookingFormSubmit = async (data: {
    property: {
      id: string;
      title: string;
      image: string;
      pricePerNight: number;
      deposit: number;
      commission: number;
      hostWallet: string;
    };
    dates: { from: Date; to: Date };
    guests: number;
    totalAmount: number;
    depositAmount: number;
  }) => {
    // If not connected, attempt to connect first
    if (!isConnected || !publicKey) {
      toast.loading('Connecting wallet...', { id: 'connect-wallet' });
      try {
        await connect();
        toast.dismiss('connect-wallet');

        return handleBookingFormSubmit(data);
      } catch (error) {
        console.error('Wallet connection failed:', error);
        toast.dismiss('connect-wallet');
        toast.error(
          `Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return; // Stop if connection fails
      }
    }

    if (!publicKey) {
      toast.error('Wallet public key not available after connection attempt.');
      return;
    }

    try {
      setIsProcessingBooking(true);
      toast.loading('Creating booking...', { id: 'create-booking' });

      const createdBooking = await bookingAPI.createBooking({
        propertyId: data.property.id,
        userId: publicKey,
        dates: data.dates,
        checkIn: data.dates.from.toISOString(),
        checkOut: data.dates.to.toISOString(),
        guests: data.guests,
        totalAmount: data.totalAmount,
        deposit: data.depositAmount,
      });

      toast.dismiss('create-booking');
      toast.success('Booking created! Proceeding to payment.');

      setCurrentBookingData({
        bookingId: createdBooking.data.id,
        property: data.property,
        dates: data.dates,
        guests: data.guests,
        totalAmount: data.totalAmount,
        escrowAddress: createdBooking.data.escrowAddress || '',
      });

      setBookingStep('payment');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.dismiss('create-booking');
      toast.error(
        `Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessingBooking(false);
    }
  };

  const handlePaymentSuccess = (transactionHash: string) => {
    if (currentBookingData) {
      setCurrentBookingData((prev) => (prev ? { ...prev, transactionHash } : null));
      setBookingStep('confirmation');
      toast.success('Payment successful and confirmed!');
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    toast.error(`Payment failed: ${error}`);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        {bookingStep === 'form' && (
          <BookingForm onSubmit={handleBookingFormSubmit} propertyId={params.propertyId} />
        )}

        {bookingStep === 'payment' && currentBookingData && (
          <div className="flex justify-center">
            <PaymentButton
              bookingId={currentBookingData.bookingId}
              amount={currentBookingData.totalAmount.toString()}
              escrowAddress={currentBookingData.escrowAddress}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>
        )}

        {bookingStep === 'confirmation' && currentBookingData && (
          <BookingConfirmation
            bookingId={currentBookingData.bookingId}
            property={currentBookingData.property}
            dates={currentBookingData.dates}
            guests={currentBookingData.guests}
            totalAmount={currentBookingData.totalAmount}
            transactionHash={currentBookingData.transactionHash || 'N/A'}
          />
        )}

        {/* WalletConnectionModal is still rendered, but its isOpen state is managed by setShowWalletModal */}
        <WalletConnectionModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      </div>
    </div>
  );
}
