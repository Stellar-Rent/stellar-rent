import { FeaturedProperties } from '@/components/features/properties/FeaturedProperties';
import { SearchBar } from '@/components/features/search/SearchBar';
import { HowItWorks } from '@/components/shared/HowItWorks';
import { Testimonials } from '@/components/shared/Testimonials';
import { Footer } from '@/components/shared/layout/Footer';
import { HeroSection } from '@/components/shared/layout/HeroSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/logo.png" alt="StellaRent" className="h-10" />
          </div>
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <HeroSection
          title="Find Your Perfect Rental Property"
          subtitle="Discover and book unique homes, apartments, and more with secure blockchain-based rentals"
          ctaText="Get Started"
          ctaLink="/register"
        />

        <section className="container mx-auto px-4 py-12 -mt-12 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <SearchBar />
          </div>
        </section>

        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Properties</h2>
            <FeaturedProperties limit={4} />
            <div className="text-center mt-8">
              <Button asChild variant="outline">
                <Link href="/search">View All Properties</Link>
              </Button>
            </div>
          </div>
        </section>

        <HowItWorks />
        <Testimonials />
      </main>

      <Footer />
    </div>
  );
}
