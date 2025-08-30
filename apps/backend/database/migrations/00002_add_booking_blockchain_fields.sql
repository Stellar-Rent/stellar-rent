-- Add blockchain booking support fields
-- Migration: Add blockchain_booking_id and cancelled_at to bookings table

-- Add blockchain booking ID field to track on-chain bookings
ALTER TABLE public.bookings 
ADD COLUMN blockchain_booking_id text NULL;

-- Add cancelled_at timestamp for tracking cancellation time
ALTER TABLE public.bookings 
ADD COLUMN cancelled_at timestamptz NULL;

-- Add payment transaction hash for confirmed bookings
ALTER TABLE public.bookings 
ADD COLUMN payment_transaction_hash text NULL;

-- Add paid_at timestamp for tracking payment completion
ALTER TABLE public.bookings 
ADD COLUMN paid_at timestamptz NULL;

-- Create index for blockchain booking ID lookups
CREATE INDEX IF NOT EXISTS bookings_blockchain_booking_id_idx ON public.bookings(blockchain_booking_id);

-- Create index for cancelled bookings
CREATE INDEX IF NOT EXISTS bookings_cancelled_at_idx ON public.bookings(cancelled_at);

-- Make escrow_address nullable since it might not be created in error cases
ALTER TABLE public.bookings 
ALTER COLUMN escrow_address DROP NOT NULL;

-- Update the status check constraint to include 'ongoing' status
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'ongoing'));

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.blockchain_booking_id IS 'Unique identifier from the Stellar smart contract booking';
COMMENT ON COLUMN public.bookings.cancelled_at IS 'Timestamp when the booking was cancelled';
COMMENT ON COLUMN public.bookings.payment_transaction_hash IS 'Stellar transaction hash for payment confirmation';
COMMENT ON COLUMN public.bookings.paid_at IS 'Timestamp when payment was confirmed on blockchain';