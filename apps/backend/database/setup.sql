-- ===============================================
-- StellarRent Database Setup Script
-- ===============================================
-- This script must be executed in the Supabase SQL Editor
-- to fully configure the database

-- ===============================================
-- 1. REQUIRED EXTENSIONS
-- ===============================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- 2. USERS TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes to optimize queries
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users(created_at);

-- ===============================================
-- 3. PROPERTIES TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  latitude decimal(9,6),
  longitude decimal(9,6),
  amenities text[] NOT NULL DEFAULT '{}',
  images text[] NOT NULL DEFAULT '{}',
  bedrooms integer NOT NULL,
  bathrooms integer NOT NULL,
  max_guests integer NOT NULL,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'available',
  availability jsonb NOT NULL DEFAULT '[]',
  security_deposit decimal(10,2) NOT NULL DEFAULT 0,
  cancellation_policy jsonb,
  property_token text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints to validate data
  CONSTRAINT status_values CHECK (status IN ('available', 'booked', 'maintenance')),
  CONSTRAINT max_guests_check CHECK (max_guests > 0 AND max_guests <= 20),
  CONSTRAINT bedrooms_check CHECK (bedrooms > 0),
  CONSTRAINT bathrooms_check CHECK (bathrooms > 0),
  CONSTRAINT price_check CHECK (price > 0),
  CONSTRAINT security_deposit_check CHECK (security_deposit >= 0)
);

-- Indexes to optimize queries
CREATE INDEX IF NOT EXISTS properties_owner_id_idx ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city);
CREATE INDEX IF NOT EXISTS properties_country_idx ON public.properties(country);
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);
CREATE INDEX IF NOT EXISTS properties_price_idx ON public.properties(price);
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON public.properties(created_at);
CREATE INDEX IF NOT EXISTS properties_amenities_idx ON public.properties USING GIN(amenities);

-- Composite index for geographic searches
CREATE INDEX IF NOT EXISTS properties_location_idx ON public.properties(city, country);

-- ===============================================
-- 3.1 BOOKINGS TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dates jsonb NOT NULL,
  guests integer NOT NULL CHECK (guests > 0),
  total numeric NOT NULL CHECK (total >= 0),
  deposit numeric NOT NULL CHECK (deposit >= 0),
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  escrow_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes to optimize queries on bookings
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_property_id_idx ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON public.bookings(created_at);

-- ===============================================
-- 4. FUNCTION TO UPDATE updated_at
-- ===============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 4.1 BOOKINGS updated_at TRIGGER
-- ===============================================

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 5. STORAGE CONFIGURATION
-- ===============================================

-- Create bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- User policies
-- Users can view and update their own information
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Property policies
-- Everyone can view available properties
CREATE POLICY "Anyone can view available properties" ON public.properties
    FOR SELECT USING (status = 'available' OR auth.uid() = owner_id);

-- Only property owners can update their properties
CREATE POLICY "Owners can update own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = owner_id);

-- Only property owners can delete their properties
CREATE POLICY "Owners can delete own properties" ON public.properties
    FOR DELETE USING (auth.uid() = owner_id);

-- Authenticated users can create properties
CREATE POLICY "Authenticated users can create properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ===============================================
-- 6.1 BOOKINGS RLS POLICIES
-- ===============================================

-- Enable Row Level Security on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can create bookings (must be themselves)
CREATE POLICY "Authenticated users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete own bookings" ON public.bookings
    FOR DELETE USING (auth.uid() = user_id);

-- ===============================================
-- 7. STORAGE POLICIES
-- ===============================================

-- Policy to read images (public)
CREATE POLICY "Anyone can view property images" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

-- Policy to upload images (authenticated users only)
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

-- Policy to update images (property owners only)
CREATE POLICY "Users can update own property images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

-- Policy to delete images (property owners only)
CREATE POLICY "Users can delete own property images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

-- ===============================================
-- 8. SAMPLE DATA (OPTIONAL)
-- ===============================================

-- Uncomment these lines to insert sample data

/*
-- Sample user
INSERT INTO public.users (id, email, name, password_hash) VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'test@stellarrent.com', 'Test User', '$2b$10$example.hash.here')
ON CONFLICT (email) DO NOTHING;

-- Sample property
INSERT INTO public.properties (
    title, description, price, address, city, country,
    latitude, longitude, amenities, images, bedrooms, bathrooms, 
    max_guests, owner_id, status
) VALUES (
    'Modern House in Buenos Aires',
    'Beautiful house with all necessary amenities for a perfect stay.',
    150.00,
    'Av. Corrientes 1234',
    'Buenos Aires',
    'Argentina',
    -34.6037,
    -58.3816,
    ARRAY['wifi', 'kitchen', 'air_conditioning', 'parking'],
    ARRAY['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    3,
    2,
    6,
    '123e4567-e89b-12d3-a456-426614174000',
    'available'
) ON CONFLICT DO NOTHING;
*/

-- ===============================================
-- 9. VERIFICATION
-- ===============================================

-- Verify that tables were created correctly
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'properties', 'bookings');

-- Verify that the bucket was created
SELECT name, public FROM storage.buckets WHERE name = 'property-images';

-- ===============================================
-- SCRIPT COMPLETED
-- ===============================================
-- ✅ Tables created: users, properties, bookings
-- ✅ Indexes optimized for queries
-- ✅ Constraints and validations applied
-- ✅ Triggers for updated_at configured
-- ✅ Storage bucket configured
-- ✅ Security policies applied
-- ✅ Ready for development!
-- =============================================== 
