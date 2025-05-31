'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useWallet } from '@/hooks/useWallet';
import { WalletConnectionModal } from './WalletConnectionModal';
import { toast } from 'react-hot-toast';

interface BookingFormProps {
  onSubmit: (data: {
    property: { title: string; image: string };
    dates: { from: Date; to: Date };
    guests: number;
    totalAmount: number;
  }) => void;
}

export function BookingForm({ onSubmit }: BookingFormProps) {
  const { isConnected, publicKey } = useWallet();
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [guests, setGuests] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock property data - replace with actual data fetching
  const property = {
    title: 'Luxury Beachfront Villa',
    image: '/images/property-placeholder.jpg',
    pricePerNight: 150,
    deposit: 500,
    commission: 0.00001,
    hostWallet: 'GCO2IP3MJNUOKS4PUDI4C7LGGMQDJGXG3COYX3WSB4HHNAHKYV5YL3VC', // Host's wallet address
  };

  const calculateTotal = () => {
    if (!selectedDates?.from || !selectedDates?.to) return 0;
    const nights = Math.ceil(
      (selectedDates.to.getTime() - selectedDates.from.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return nights * property.pricePerNight + property.deposit;
  };

  const handleSubmit = async () => {
    if (!selectedDates?.from || !selectedDates?.to) {
      toast.error('Please select dates first');
      return;
    }

    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }

    try {
      setIsProcessing(true);
      const total = calculateTotal();

      // Call the parent component's onSubmit with the booking data
      onSubmit({
        property,
        dates: {
          from: selectedDates.from,
          to: selectedDates.to,
        },
        guests,
        totalAmount: total,
      });

      toast.success('Payment successful!');
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Column - Booking Summary */}
      <div className="space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">{property.title}</h1>
          <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
            <img
              src={property.image}
              alt={property.title}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Selected Dates</h2>
              {selectedDates?.from && selectedDates?.to ? (
                <p>
                  {format(selectedDates.from, 'MMM dd, yyyy')} -{' '}
                  {format(selectedDates.to, 'MMM dd, yyyy')}
                </p>
              ) : (
                <p>Please select dates</p>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Guests</h2>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                >
                  -
                </Button>
                <span>{guests}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setGuests(guests + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column - Calendar and Payment */}
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Select Dates</h2>
          <Calendar
            mode="range"
            selected={selectedDates}
            onSelect={setSelectedDates}
            className="rounded-md border"
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Cost Breakdown</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Nightly Rate</span>
              <span>${property.pricePerNight}/night</span>
            </div>
            <div className="flex justify-between">
              <span>Security Deposit</span>
              <span>${property.deposit}</span>
            </div>
            <div className="flex justify-between">
              <span>Commission</span>
              <span>${property.commission} USD</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>
          </div>

          <Button
            className="w-full mt-6 bg-[#4A90E2] hover:bg-[#357ABD]"
            onClick={handleSubmit}
            disabled={!selectedDates?.from || !selectedDates?.to || isProcessing}
          >
            {isProcessing
              ? 'Processing...'
              : isConnected
              ? 'Pay with USDC'
              : 'Connect Wallet'}
          </Button>
        </Card>
      </div>

      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
} 