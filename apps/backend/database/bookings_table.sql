-- Sample StellarRent Bookings Table Schema

CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL, -- TODO: Add foreign key when properties table is created
  amount DECIMAL(19,7) NOT NULL, -- Sufficient precision for USDC amounts
  currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  escrow_address TEXT, -- Stellar address for escrow
  transaction_hash VARCHAR(64), -- Stellar transaction hash (64 hex characters)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX idx_bookings_transaction_hash ON public.bookings(transaction_hash);
