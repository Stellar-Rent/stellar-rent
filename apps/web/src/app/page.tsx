import { FeaturedProperties } from '@/components/features/properties/FeaturedProperties';
import { SearchBar } from '@/components/features/search/SearchBar';
import { HowItWorks } from '@/components/shared/HowItWorks';
import { Testimonials } from '@/components/shared/Testimonials';
import { Footer } from '@/components/shared/layout/Footer';
import { HeroSection } from '@/components/shared/layout/HeroSection';
import { Suspense } from 'react';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col w-full">
      {/* Hero Section */}
      <section id="hero" className="relative">
        <HeroSection />
        <div className="relative z-10">
          <SearchBar />
        </div>
      </section>

      {/* Featured Properties Section */}
      <Suspense fallback={<div className="py-16 text-center">Loading properties...</div>}>
        <FeaturedProperties />
      </Suspense>

      {/* How It Works Section */}
      <section id="how-it-works">
        <HowItWorks />
      </section>

      {/* Testimonials Section */}
      <section id="testimonials">
        <Testimonials />
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
