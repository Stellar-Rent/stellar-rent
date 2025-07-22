-- Complete database setup for StellarRent
-- Run this in Supabase SQL Editor to fix all table structures
-- This combines all migrations in the correct order

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.wallet_challenges CASCADE;
DROP TABLE IF EXISTS public.wallet_users CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

-- Create migrations table
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- FROM 00001_initial_schema.sql
-- ==========================================

-- Create users table (REQUIRED by backend)
CREATE TABLE public.users (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create profiles table (linked to users)
CREATE TABLE public.profiles (
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
CREATE TABLE public.properties (
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
CREATE TABLE public.bookings (
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

-- ==========================================
-- FROM 00004_create_wallet_auth_tables.sql
-- ==========================================

-- Create wallet_challenges table
CREATE TABLE public.wallet_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

-- Create wallet_users table
CREATE TABLE public.wallet_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_key TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Users indexes
CREATE INDEX users_email_idx ON public.users(email);
CREATE INDEX users_created_at_idx ON public.users(created_at);

-- Profiles indexes
CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);

-- Properties indexes
CREATE INDEX properties_owner_id_idx ON public.properties(owner_id);
CREATE INDEX properties_city_idx ON public.properties(city);
CREATE INDEX properties_country_idx ON public.properties(country);
CREATE INDEX properties_status_idx ON public.properties(status);
CREATE INDEX properties_price_idx ON public.properties(price);
CREATE INDEX properties_created_at_idx ON public.properties(created_at);
CREATE INDEX properties_amenities_idx ON public.properties USING GIN(amenities);
CREATE INDEX properties_location_idx ON public.properties(city, country);

-- Bookings indexes
CREATE INDEX bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX bookings_property_id_idx ON public.bookings(property_id);
CREATE INDEX bookings_status_idx ON public.bookings(status);
CREATE INDEX bookings_created_at_idx ON public.bookings(created_at);

-- Wallet indexes
CREATE INDEX wallet_challenges_expires_at_idx ON public.wallet_challenges(expires_at);
CREATE INDEX wallet_challenges_public_key_idx ON public.wallet_challenges(public_key);
CREATE INDEX wallet_users_public_key_idx ON public.wallet_users(public_key);
CREATE INDEX wallet_users_user_id_idx ON public.wallet_users(user_id);

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles-avatars', 'profiles-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_users ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_users_updated_at
    BEFORE UPDATE ON public.wallet_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- RECORD MIGRATIONS
-- ==========================================

INSERT INTO migrations (name) VALUES 
    ('00001_initial_schema'),
    ('00002_storage_and_rls'),
    ('00003_triggers'),
    ('00004_create_wallet_auth_tables'),
    ('00005_create_profile_table')
ON CONFLICT (name) DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully!' as message; 