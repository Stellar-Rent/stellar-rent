'use client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { format } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'react-hot-toast';

interface BookingFormProps {
  onSubmit: (data: {
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
  }) => void;
  propertyId: string;
}

export function BookingForm({ onSubmit, propertyId }: BookingFormProps) {
  const { isConnected, publicKey } = useWallet();
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [guests, setGuests] = useState(1);

  const property = {
    id: propertyId,
    title: 'Luxury Beachfront Villa',
    image: '/images/property-placeholder.jpg',
    pricePerNight: 150,
    deposit: 500,
    commission: 0.00001,
    hostWallet: 'GCO2IP3MJNUOKS4PUDI4C7LGGMQDJGXG3COYX3WSB4HHNAHKYV5YL3VC',
  };

  const calculateTotal = () => {
    if (!selectedDates?.from || !selectedDates?.to) return 0;
    const nights = Math.ceil(
      (selectedDates.to.getTime() - selectedDates.from.getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights * property.pricePerNight + property.deposit;
  };

  const handleSubmit = async () => {
    if (!selectedDates?.from || !selectedDates?.to) {
      toast.error('Please select dates first');
      return;
    }

    try {
      const total = calculateTotal();
      const deposit = property.deposit;

      onSubmit({
        property,
        dates: {
          from: selectedDates.from,
          to: selectedDates.to,
        },
        guests,
        totalAmount: total,
        depositAmount: deposit,
      });
    } catch (error) {
      console.error('Error preparing booking:', error);
      toast.error('Failed to prepare booking. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Left Column - Booking Summary */}
      <div className="space-y-6">
        <Card className="p-6">
          <h1 className="mb-4 text-2xl font-bold">{property.title}</h1>
          <div className="relative mb-4 aspect-video rounded-lg overflow-hidden">
            <img
              src={property.image || '/placeholder.svg'}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-lg font-semibold">Selected Dates</h2>
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
              <h2 className="mb-2 text-lg font-semibold">Guests</h2>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                >
                  -
                </Button>
                <span>{guests}</span>
                <Button variant="outline" size="icon" onClick={() => setGuests(guests + 1)}>
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
          <h2 className="mb-4 text-xl font-bold">Select Dates</h2>
          <Calendar
            mode="range"
            selected={selectedDates}
            onSelect={setSelectedDates}
            className="rounded-md border"
          />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">Cost Breakdown</h2>
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
            <div className="mt-2 border-t pt-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>
          </div>
          <Button
            className="mt-6 w-full bg-[#4A90E2] hover:bg-[#357ABD]"
            onClick={handleSubmit}
            disabled={!selectedDates?.from || !selectedDates?.to}
          >
            Proceed to Payment
          </Button>
        </Card>
      </div>
    </div>
  );
}
