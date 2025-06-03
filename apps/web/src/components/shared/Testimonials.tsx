'use client';

import { Card } from '@/components/ui/card';
import { QuoteIcon } from 'lucide-react';
import Image from 'next/image';

type Testimonial = {
  id: number;
  name: string;
  role: string;
  quote: string;
  avatar: string;
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Alex Thompson',
    role: 'Digital Nomad',
    quote:
      'StellarRent has transformed how I find accommodations during my travels. The crypto payment option means I can book instantly without currency exchange hassles.',
    avatar: '/images/avatar-1.jpg',
  },
  {
    id: 2,
    name: 'Maria Sanchez',
    role: 'Property Owner',
    quote:
      'As a property owner, I love the simplicity of receiving payments directly in cryptocurrency. The platform is intuitive and the support team is always responsive.',
    avatar: '/images/avatar-2.jpg',
  },
  {
    id: 3,
    name: 'David Chen',
    role: 'Business Traveler',
    quote:
      'The seamless booking process and transparent pricing make StellarRent my go-to platform for business trips. Being able to pay with crypto is the cherry on top.',
    avatar: '/images/avatar-3.jpg',
  },
];

export const Testimonials = () => {
  return (
    <section className="py-16 bg-white dark:bg-[#0B1D39]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-muted-foreground max-w-2xl">
            Hear from our community of travelers and property owners about their experiences with
            StellarRent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="p-6 h-full flex flex-col">
              <div className="mb-4">
                <QuoteIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-muted-foreground mb-6 flex-grow">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4 bg-muted">
                  {testimonial.avatar ? (
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                      <span className="text-blue-700 dark:text-blue-300 font-bold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
