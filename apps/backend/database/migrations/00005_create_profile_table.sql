
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    preferences JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'pending')),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Service role can manage profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions to the service role
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
