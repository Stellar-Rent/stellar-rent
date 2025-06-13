'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Mail, MessageCircle, Phone, User } from 'lucide-react';

interface Host {
  name: string;
  email: string;
  phone?: string;
}

interface HostContactCardProps {
  host: Host;
}

export function HostContactCard({ host }: HostContactCardProps) {
  const handleEmailContact = () => {
    window.location.href = `mailto:${host.email}?subject=Booking Inquiry - StellarRent`;
  };

  const handlePhoneContact = () => {
    if (host.phone) {
      window.location.href = `tel:${host.phone}`;
    }
  };

  const handleMessageHost = () => {
    // TODO: Implement messaging functionality
    // This should open a modal or navigate to messaging interface
    console.error('Messaging functionality not implemented yet');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-foreground">Your Host</h2>
      </CardHeader>

      <div className="px-6 pb-6 space-y-6">
        {/* Host Info */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-[#4A90E2] flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{host.name}</h3>
            <p className="text-sm text-muted-foreground">Property Host</p>
            <div className="flex items-center space-x-1 mt-1">
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">5.0 rating</span>
            </div>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Contact Information</h4>

          {/* Email */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-[#4A90E2]" />
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">{host.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmailContact}
              className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
            >
              Send Email
            </Button>
          </div>

          {/* Phone */}
          {host.phone && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-[#4A90E2]" />
                <div>
                  <p className="text-sm font-medium text-foreground">Phone</p>
                  <p className="text-sm text-muted-foreground">{host.phone}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePhoneContact}
                className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
              >
                Call Now
              </Button>
            </div>
          )}

          {/* In-app Messaging */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-5 h-5 text-[#4A90E2]" />
              <div>
                <p className="text-sm font-medium text-foreground">Message</p>
                <p className="text-sm text-muted-foreground">Send a secure message</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMessageHost}
              className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
            >
              Message
            </Button>
          </div>
        </div>

        {/* Host Guidelines */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-3">Communication Guidelines</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A90E2] mt-2 flex-shrink-0" />
              <span>Response time: Usually within 2-4 hours</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A90E2] mt-2 flex-shrink-0" />
              <span>Best contact method: Email for detailed questions</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A90E2] mt-2 flex-shrink-0" />
              <span>Emergency contact: Phone for urgent matters only</span>
            </li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-3">Quick Actions</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEmailContact()}
              className="justify-start text-left"
            >
              Ask about check-in process
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEmailContact()}
              className="justify-start text-left"
            >
              Request local recommendations
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEmailContact()}
              className="justify-start text-left"
            >
              Inquire about amenities
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
