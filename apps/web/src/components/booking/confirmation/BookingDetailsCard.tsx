'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar, DollarSign, MapPin, Users } from 'lucide-react';

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

interface BookingDetailsCardProps {
  bookingData: BookingData;
}

export function BookingDetailsCard({ bookingData }: BookingDetailsCardProps) {
  const { property, dates, guests, totalAmount } = bookingData;

  const nights = Math.ceil((dates.to.getTime() - dates.from.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-foreground">Booking Details</h2>
      </CardHeader>

      <div className="px-6 pb-6 space-y-6">
        {/* Property Info */}
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {property.image ? (
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <MapPin className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">{property.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Luxury accommodation with premium amenities
            </p>
          </div>
        </div>

        {/* Booking Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dates */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="w-5 h-5 text-[#4A90E2]" />
            <div>
              <p className="text-sm font-medium text-foreground">Check-in & Check-out</p>
              <p className="text-sm text-muted-foreground">
                {format(dates.from, 'MMM dd, yyyy')} - {format(dates.to, 'MMM dd, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                {nights} night{nights !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Guests */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
            <Users className="w-5 h-5 text-[#4A90E2]" />
            <div>
              <p className="text-sm font-medium text-foreground">Guests</p>
              <p className="text-sm text-muted-foreground">
                {guests} guest{guests !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 sm:col-span-2">
            <DollarSign className="w-5 h-5 text-[#4A90E2]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Total Amount</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-foreground">${totalAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  ${(totalAmount / nights).toFixed(0)} per night
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-foreground mb-3">Next Steps</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A90E2] mt-2 flex-shrink-0" />
              <span>Check your email for detailed booking confirmation</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A90E2] mt-2 flex-shrink-0" />
              <span>Contact your host for check-in instructions</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A90E2] mt-2 flex-shrink-0" />
              <span>Review property rules and local guidelines</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
