'use client';

import { FeaturedProperties } from '@/components/features/properties/FeaturedProperties';
import { SearchBar } from '@/components/features/search/SearchBar';
import { HowItWorks } from '@/components/shared/HowItWorks';
import { Testimonials } from '@/components/shared/Testimonials';
import { Footer } from '@/components/shared/layout/Footer';
import { HeroSection } from '@/components/shared/layout/HeroSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth/use-auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Optional: redirect authenticated users to /search
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/search');
    }
  }, [isAuthenticated, router]);

  // If authenticated, show loading state while redirecting
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Redirecting to search...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with Login/Register CTAs */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B1320]/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="StellaRent" width={120} height={40} priority />
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Search Bar Section */}
        <section className="bg-white dark:bg-[#0B1D39] py-8">
          <div className="container mx-auto px-4">
            <SearchBar />
          </div>
        </section>

        {/* Featured Properties */}
        <FeaturedProperties />

        {/* How It Works */}
        <HowItWorks />

        {/* Testimonials */}
        <Testimonials />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
