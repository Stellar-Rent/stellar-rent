CREATE TABLE IF NOT EXISTS public.wallet_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_key TEXT NOT NULL,
    challenge TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_wallet_challenges_public_key ON public.wallet_challenges(public_key);
CREATE INDEX IF NOT EXISTS idx_wallet_challenges_expires_at ON public.wallet_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_wallet_challenges_challenge ON public.wallet_challenges(challenge);

-- Create wallet_users table for wallet-based users
CREATE TABLE IF NOT EXISTS public.wallet_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_wallet_users_public_key ON public.wallet_users(public_key);

-- Create function to automatically clean up expired challenges
CREATE OR REPLACE FUNCTION public.cleanup_expired_challenges()
RETURNS void AS $$
BEGIN
    DELETE FROM public.wallet_challenges 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.wallet_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_users ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (your backend can access these tables)
CREATE POLICY "Service role can manage wallet_challenges" ON public.wallet_challenges
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage wallet_users" ON public.wallet_users
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions to the service role
GRANT ALL ON public.wallet_challenges TO service_role;
GRANT ALL ON public.wallet_users TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Record this migration as completed
INSERT INTO migrations (name) VALUES ('001_create_wallet_auth_tables') ON CONFLICT (name) DO NOTHING;

