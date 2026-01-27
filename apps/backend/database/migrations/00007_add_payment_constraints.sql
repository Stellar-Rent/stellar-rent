-- Migration: Add payment validation constraints and atomic confirmation function
-- This migration prevents duplicate transaction hash usage and ensures atomic payment confirmation.

-- Unique constraint to prevent the same transaction hash being used for multiple bookings
CREATE UNIQUE INDEX IF NOT EXISTS bookings_payment_tx_hash_unique_idx
ON public.bookings (payment_transaction_hash)
WHERE payment_transaction_hash IS NOT NULL;

-- RPC function for atomic booking payment confirmation with validations
CREATE OR REPLACE FUNCTION confirm_booking_payment_atomic(
    p_booking_id UUID,
    p_transaction_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Validate transaction hash is provided
    IF p_transaction_hash IS NULL OR p_transaction_hash = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_TRANSACTION_HASH',
            'message', 'Transaction hash is required'
        );
    END IF;

    -- Lock the booking row for update to prevent concurrent modifications
    SELECT id, status, payment_transaction_hash
    INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    -- Check if booking exists
    IF v_booking IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_FOUND',
            'message', 'Booking not found'
        );
    END IF;

    -- Check if booking is already paid
    IF v_booking.payment_transaction_hash IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ALREADY_PAID',
            'message', 'Booking has already been paid',
            'existing_hash', v_booking.payment_transaction_hash
        );
    END IF;

    -- Check if transaction hash is already used by another booking
    IF EXISTS (
        SELECT 1 FROM public.bookings
        WHERE payment_transaction_hash = p_transaction_hash
        AND id != p_booking_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'DUPLICATE_TRANSACTION',
            'message', 'Transaction hash is already used by another booking'
        );
    END IF;

    -- Update the booking with payment confirmation
    UPDATE public.bookings
    SET
        status = 'confirmed',
        payment_transaction_hash = p_transaction_hash,
        paid_at = now(),
        updated_at = now()
    WHERE id = p_booking_id;

    -- Log the successful payment confirmation
    INSERT INTO public.sync_logs (operation, status, message, data, created_at)
    VALUES (
        'confirm_booking_payment_atomic',
        'success',
        'Payment confirmed atomically',
        jsonb_build_object(
            'booking_id', p_booking_id,
            'transaction_hash', p_transaction_hash
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'transaction_hash', p_transaction_hash,
        'status', 'confirmed'
    );

EXCEPTION WHEN unique_violation THEN
    -- Handle the case where another process inserted the same tx hash concurrently
    RETURN jsonb_build_object(
        'success', false,
        'error', 'DUPLICATE_TRANSACTION',
        'message', 'Transaction hash was just used by another booking (concurrent update)'
    );
WHEN OTHERS THEN
    -- Log error and return failure
    INSERT INTO public.sync_logs (operation, status, error_details, created_at)
    VALUES (
        'confirm_booking_payment_atomic',
        'error',
        jsonb_build_object(
            'error', SQLERRM,
            'error_state', SQLSTATE,
            'booking_id', p_booking_id::text,
            'transaction_hash', p_transaction_hash
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', false,
        'error', 'DB_ERROR',
        'message', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION confirm_booking_payment_atomic(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_booking_payment_atomic(UUID, TEXT) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION confirm_booking_payment_atomic IS 'Atomically confirms a booking payment with validation: checks booking exists, is not already paid, and transaction hash is not reused.';
