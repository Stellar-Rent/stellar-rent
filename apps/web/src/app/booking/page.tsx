'use client';

import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BookingForm } from '@/components/booking/BookingForm';
import { WalletConnectionModal } from '@/components/booking/WalletConnectionModal';
import { useWallet } from '@/hooks/useWallet';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'react-hot-toast';
import PaymentButton from '~/components/payment/paymentButton';
import { bookingAPI } from '~/services/api';

interface BookingPageProps {
  params: Promise<{
    propertyId: string;
  }>;
}

type BookingFlowStep = 'form' | 'payment' | 'confirmation';

export default function BookingPage({ params }: BookingPageProps) {
  // Unwrap params using React.use() for Next.js 15 compatibility
  const { propertyId } = use(params);
  const { theme: _theme } = useTheme();
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
    if (!isConnected || !publicKey) {
      toast.loading('Connecting wallet...', { id: 'connect-wallet' });
      try {
        await connect();
        toast.dismiss('connect-wallet');
        return;
      } catch (error) {
        console.error('Wallet connection failed:', error);
        toast.dismiss('connect-wallet');
        toast.error('Failed to connect wallet');
        return;
      }
    }

    try {
      setIsProcessingBooking(true);
      toast.loading('Creating booking...', { id: 'create-booking' });

      // Assuming APIResponse wraps data in a 'data' property based on TS errors
      const response = await bookingAPI.createBooking({
        propertyId: data.property.id,
        // Using as any for userId if it's not in the strict BookingFormData type yet
        ...({ userId: publicKey } as any),
        dates: data.dates,
        guests: data.guests,
        total: data.totalAmount,
        deposit: data.depositAmount,
      });

      const bookingResult = (response as any).data || response;

      toast.dismiss('create-booking');
      toast.success('Booking created! Proceeding to payment.');

      setCurrentBookingData({
        bookingId: bookingResult.bookingId,
        property: data.property,
        dates: data.dates,
        guests: data.guests,
        totalAmount: data.totalAmount,
        escrowAddress: bookingResult.escrowAddress,
      });

      setBookingStep('payment');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.dismiss('create-booking');
      toast.error('Failed to create booking');
    } finally {
      setIsProcessingBooking(false);
    }
  };

  const handlePaymentSuccess = (transactionHash: string) => {
    if (currentBookingData) {
      setCurrentBookingData((prev) => (prev ? { ...prev, transactionHash } : null));
      setBookingStep('confirmation');
      toast.success('Payment successful!');
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
          <BookingForm onSubmit={handleBookingFormSubmit} propertyId={propertyId} />
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

        <WalletConnectionModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      </div>
    </div>
  );
}
