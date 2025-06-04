'use client';

import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { CheckCircle2 as CheckCircle2Icon } from 'lucide-react';

interface BookingConfirmationProps {
  bookingId: string;
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
}

export function BookingConfirmation({
  bookingId,
  property,
  dates,
  guests,
  totalAmount,
  transactionHash,
}: BookingConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle2Icon className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground">
          Your booking has been successfully processed
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Booking Details</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Booking ID:</span> {bookingId}
              </p>
              <p>
                <span className="font-medium">Property:</span> {property.title}
              </p>
              <p>
                <span className="font-medium">Dates:</span>{' '}
                {format(dates.from, 'MMM dd, yyyy')} -{' '}
                {format(dates.to, 'MMM dd, yyyy')}
              </p>
              <p>
                <span className="font-medium">Guests:</span> {guests}
              </p>
              <p>
                <span className="font-medium">Total Amount:</span> ${totalAmount}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Transaction Information</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Transaction Hash:</span>{' '}
                <span className="font-mono text-sm">{transactionHash}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Your payment has been processed and is now in escrow. The funds
                will be released to the host after your stay.
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Check your email for booking confirmation</li>
              <li>Contact the host for check-in instructions</li>
              <li>Review the property rules and guidelines</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
} 