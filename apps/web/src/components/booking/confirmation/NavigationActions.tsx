'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ArrowRight, BookOpen, Calendar, Download, Home, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NavigationActions() {
  const router = useRouter();

  const handleMyBookings = () => {
    router.push('/dashboard/bookings');
  };

  const handleDownloadConfirmation = () => {
    console.log('Download confirmation PDF');
  };

  const handleShareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: 'StellarRent Booking Confirmation',
        text: 'Check out my booking confirmation!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleViewProperty = () => {
    router.push('/property/123');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-foreground">What's Next?</h2>
      </CardHeader>

      <div className="px-6 pb-6 space-y-4">
        {/* Primary Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleMyBookings}
            className="w-full bg-[#4A90E2] hover:bg-[#357ABD] text-white flex items-center justify-between group"
            size="lg"
          >
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">View My Bookings</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white flex items-center justify-between group"
            size="lg"
          >
            <div className="flex items-center space-x-3">
              <Home className="w-5 h-5" />
              <span className="font-medium">Browse More Properties</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-3">Additional Actions</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadConfirmation}
              className="justify-start text-left hover:bg-muted"
            >
              <Download className="w-4 h-4 mr-3" />
              Download Confirmation PDF
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareBooking}
              className="justify-start text-left hover:bg-muted"
            >
              <Share2 className="w-4 h-4 mr-3" />
              Share Booking Details
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewProperty}
              className="justify-start text-left hover:bg-muted"
            >
              <BookOpen className="w-4 h-4 mr-3" />
              View Property Details
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-3">Need Help?</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              If you have any questions about your booking or need assistance, our support team is
              here to help.
            </p>
            <div className="flex space-x-4 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('mailto:support@stellarrent.com', '_blank')}
                className="text-xs"
              >
                Contact Support
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/help')}
                className="text-xs"
              >
                Help Center
              </Button>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-[#4A90E2] mt-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Important Reminder</p>
              <p className="text-muted-foreground">
                Please save this confirmation page and check your email for detailed booking
                information. Contact your host 24-48 hours before check-in to confirm arrival
                details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
