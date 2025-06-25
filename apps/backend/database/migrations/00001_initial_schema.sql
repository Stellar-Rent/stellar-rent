-- Migration: 00001_initial_schema
-- Description: Initial database schema setup for StellarRent
-- Created at: 2025-06-25

-- Enable versioning
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Record this migration
INSERT INTO migrations (name) VALUES ('00001_initial_schema');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create indexes
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