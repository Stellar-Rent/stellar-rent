'use client';

import { Calendar, CreditCard, Search } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      icon: <Search className="h-12 w-12 text-blue-900 dark:text-blue-400" />,
      title: 'Explore',
      description:
        'Search through our curated selection of properties worldwide. Filter by location, price, and amenities to find your perfect match.',
    },
    {
      icon: <Calendar className="h-12 w-12 text-blue-900 dark:text-blue-400" />,
      title: 'Book',
      description:
        'Select your dates and instantly book your stay. No lengthy approval processes or back-and-forth communication required.',
    },
    {
      icon: <CreditCard className="h-12 w-12 text-blue-900 dark:text-blue-400" />,
      title: 'Pay with Crypto',
      description:
        'Complete your transaction securely using cryptocurrency. Enjoy lower fees and faster processing times than traditional payments.',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-blue-50 to-white dark:from-[#071429] dark:to-[#0B1D39]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl">
            Renting with cryptocurrency has never been easier. Follow these three simple steps to
            get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center p-6 rounded-lg bg-card"
            >
              <div className="mb-4 p-4 rounded-full bg-blue-100 dark:bg-blue-900/50">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                    aria-labelledby="nextStepArrow"
                  >
                    <title id="nextStepArrow">Next step arrow</title>
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
