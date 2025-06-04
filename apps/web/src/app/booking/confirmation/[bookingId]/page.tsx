'use client';

import { BookingConfirmationPage } from '@/components/booking/confirmation/BookingConfirmationPage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBookingDetails } from '@/hooks/useBookingDetails';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// Layout component to avoid repetition
function BookingPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">{children}</div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPageRoute() {
  const params = useParams();
  const router = useRouter();

  // Improve type safety for route parameters
  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;

  if (!bookingId) {
    // Handle missing bookingId case
    router.push('/');
    return null;
  }

  const { bookingData, loading, error } = useBookingDetails(bookingId);

  if (loading) {
    return (
      <BookingPageLayout>
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Loading booking details...</p>
          </div>
        </Card>
      </BookingPageLayout>
    );
  }

  if (error || !bookingData) {
    return (
      <BookingPageLayout>
        <Card className="p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Booking Not Found</h1>
            <p className="text-muted-foreground">
              {error || "We couldn't find the booking you're looking for."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button onClick={() => router.push('/')} className="bg-primary hover:bg-primary/90">
                Go Home
              </Button>
            </div>
          </div>
        </Card>
      </BookingPageLayout>
    );
  }

  return (
    <BookingPageLayout>
      <BookingConfirmationPage bookingData={bookingData} />
    </BookingPageLayout>
  );
}
