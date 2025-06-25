-- Migration: 00002_storage_and_rls
-- Description: Add storage buckets and RLS policies
-- Created at: 2025-06-25

-- Record this migration
INSERT INTO migrations (name) VALUES ('00002_storage_and_rls');

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