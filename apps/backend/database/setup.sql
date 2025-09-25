-- Complete database setup for StellarRent
-- Run this in Supabase SQL Editor if the migration script fails

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create migrations table
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    address JSONB,
    preferences JSONB,
    social_links JSONB,
    verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified')) DEFAULT 'unverified',
    last_active TIMESTAMPTZ DEFAULT now()
);

-- Create properties table
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
    
    CONSTRAINT status_values CHECK (status IN ('available', 'booked', 'maintenance')),
    CONSTRAINT max_guests_check CHECK (max_guests > 0 AND max_guests <= 20),
    CONSTRAINT bedrooms_check CHECK (bedrooms > 0),
    CONSTRAINT bathrooms_check CHECK (bathrooms > 0),
    CONSTRAINT price_check CHECK (price > 0),
    CONSTRAINT security_deposit_check CHECK (security_deposit >= 0)
);

-- Create bookings table
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

-- Create basic indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users(created_at);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS properties_owner_id_idx ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city);
CREATE INDEX IF NOT EXISTS properties_country_idx ON public.properties(country);
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);
CREATE INDEX IF NOT EXISTS properties_price_idx ON public.properties(price);
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON public.properties(created_at);
CREATE INDEX IF NOT EXISTS properties_amenities_idx ON public.properties USING GIN(amenities);
CREATE INDEX IF NOT EXISTS properties_location_idx ON public.properties(city, country);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_property_id_idx ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON public.bookings(created_at);

-- =============================================================================
-- OPTIMIZED SEARCH INDEXES FOR TASK 2
-- =============================================================================

-- Composite indexes for common search patterns (status + filters)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_status_city_country 
ON public.properties (status, city, country) 
WHERE status = 'available';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_status_price 
ON public.properties (status, price) 
WHERE status = 'available';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_status_capacity 
ON public.properties (status, max_guests) 
WHERE status = 'available';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_status_bedrooms_bathrooms 
ON public.properties (status, bedrooms, bathrooms) 
WHERE status = 'available';

-- Spatial index for location-based searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location_spatial 
ON public.properties USING GIST (ll_to_earth(latitude, longitude))
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND status = 'available';

-- Text pattern indexes for ILIKE operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_city_ilike 
ON public.properties (city text_pattern_ops) 
WHERE status = 'available';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_country_ilike 
ON public.properties (country text_pattern_ops) 
WHERE status = 'available';

-- Full-text search index for descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_description_fts 
ON public.properties USING GIN (to_tsvector('english', description))
WHERE status = 'available';

-- Composite index for price range + capacity searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_price_capacity 
ON public.properties (status, price, max_guests) 
WHERE status = 'available';

-- Index for property type filtering (if property_type column exists)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_status_type 
-- ON public.properties (status, property_type) 
-- WHERE status = 'available';

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles-avatars', 'profiles-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view available properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;

-- User policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Property policies
CREATE POLICY "Anyone can view available properties" ON public.properties
    FOR SELECT USING (status = 'available' OR auth.uid() = owner_id);

CREATE POLICY "Owners can update own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own properties" ON public.properties
    FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Booking policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookings" ON public.bookings
    FOR DELETE USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Anyone can view profile avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'profiles-avatars');

CREATE POLICY "Authenticated users can upload profile avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profiles-avatars'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their profile avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profiles-avatars'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their profile avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profiles-avatars'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Anyone can view property images" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own property images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own property images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for properties table
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for bookings table
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Record all migrations as completed
INSERT INTO migrations (name) VALUES 
    ('00001_initial_schema'),
    ('00002_storage_and_rls'),
    ('00003_triggers')
ON CONFLICT (name) DO NOTHING; 