'use client';

import { CheckCircle2 } from 'lucide-react';
import { BookingDetailsCard } from './BookingDetailsCard';
import { EscrowStatusCard } from './EscrowStatusCard';
import { HostContactCard } from './HostContactCard';
import { NavigationActions } from './NavigationActions';

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

interface BookingConfirmationPageProps {
  bookingData: BookingData;
}

export function BookingConfirmationPage({ bookingData }: BookingConfirmationPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground">
            Your booking has been successfully processed and payment is secured in escrow
          </p>
          <p className="text-sm text-muted-foreground">
            Booking ID: <span className="font-mono font-medium">{bookingData.id}</span>
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <BookingDetailsCard bookingData={bookingData} />
          <HostContactCard host={bookingData.host} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <EscrowStatusCard
            escrowStatus={bookingData.escrowStatus}
            transactionHash={bookingData.transactionHash}
            totalAmount={bookingData.totalAmount}
            bookingId={bookingData.id}
          />
          <NavigationActions />
        </div>
      </div>
    </div>
  );
}
