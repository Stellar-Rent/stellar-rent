'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, CreditCard, Home } from 'lucide-react';
import Link from 'next/link';

export const HeroSection = () => {
  return (
    <div className="w-full bg-gradient-to-b from-blue-900 via-blue-800 to-white dark:from-blue-900 dark:via-blue-800 dark:to-[#0B1D39] py-16 md:py-24 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-5 -top-5 w-40 h-40 bg-blue-500 rounded-full opacity-20 animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute right-10 top-20 w-64 h-64 bg-blue-400 rounded-full opacity-10 animate-pulse"
          style={{ animationDuration: '12s' }}
        />
        <div
          className="absolute left-1/3 bottom-10 w-52 h-52 bg-blue-300 rounded-full opacity-10 animate-pulse"
          style={{ animationDuration: '10s' }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-2">
            <span className="px-3 py-1 rounded-full bg-blue-800/50 text-blue-100 dark:bg-blue-700/50 dark:text-blue-50 text-sm font-medium">
              Powered by Stellar Blockchain
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white dark:text-[#C2F2FF] leading-tight animate-fade-in">
            Rent properties instantly with cryptocurrency
          </h1>

          <p className="text-lg md:text-xl text-blue-100 dark:text-blue-200 max-w-3xl animate-fade-in-delay-100">
            StellarRent makes it easy to find your perfect home and pay securely using
            cryptocurrency. No middlemen, no hassles.
          </p>

          <div className="flex flex-wrap gap-6 justify-center mt-4 mb-6">
            <div className="flex items-center text-blue-100 dark:text-blue-200">
              <Home className="h-5 w-5 mr-2" />
              <span>100+ Properties</span>
            </div>
            <div className="flex items-center text-blue-100 dark:text-blue-200">
              <CreditCard className="h-5 w-5 mr-2" />
              <span>Instant Payments</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 animate-fade-in-delay-200">
            <Button
              size="lg"
              className={cn(
                'bg-white text-blue-900 hover:bg-blue-50 dark:bg-[#C2F2FF] dark:text-[#0B1D39] dark:hover:bg-blue-200',
                'transition-all duration-300 hover:shadow-lg'
              )}
              asChild
            >
              <Link href="/list">Explore Properties</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={cn(
                'text-white border-white hover:bg-white/10 dark:text-[#C2F2FF] dark:border-[#C2F2FF] dark:hover:bg-[#C2F2FF]/10',
                'transition-all duration-300 hover:shadow-lg'
              )}
              asChild
            >
              <Link href="/list/create">
                List My Property{' '}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
