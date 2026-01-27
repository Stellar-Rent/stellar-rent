-- Migration: Add atomic functions for sync operations
-- This migration adds PostgreSQL functions for atomic event processing
-- to prevent inconsistent states when event logging or state updates fail.

-- Ensure sync_events table has necessary constraints
ALTER TABLE public.sync_events
ADD CONSTRAINT IF NOT EXISTS sync_events_event_id_unique UNIQUE (event_id);

-- Function for processing sync events atomically
-- This function handles event insertion, booking status updates, and event marking in a single transaction
CREATE OR REPLACE FUNCTION process_sync_event_atomic(
    p_event_id TEXT,
    p_event_type TEXT,
    p_booking_id TEXT,
    p_property_id TEXT,
    p_user_id TEXT,
    p_event_data JSONB,
    p_new_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sync_event_id UUID;
BEGIN
    -- Step 1: Insert sync event (with duplicate check)
    INSERT INTO public.sync_events (event_id, event_type, booking_id, property_id, user_id, event_data, processed, created_at)
    VALUES (p_event_id, p_event_type, p_booking_id, p_property_id, p_user_id, p_event_data, false, now())
    ON CONFLICT (event_id) DO NOTHING
    RETURNING id INTO v_sync_event_id;

    -- If event already exists (duplicate), return early
    IF v_sync_event_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'DUPLICATE_EVENT', 'event_id', p_event_id);
    END IF;

    -- Step 2: Update booking status if applicable
    IF p_new_status IS NOT NULL AND p_booking_id IS NOT NULL THEN
        UPDATE public.bookings
        SET status = p_new_status, updated_at = now()
        WHERE escrow_address = p_booking_id OR blockchain_booking_id = p_booking_id;
    END IF;

    -- Step 3: Mark event as processed
    UPDATE public.sync_events
    SET processed = true, processed_at = now()
    WHERE id = v_sync_event_id;

    -- Log success
    INSERT INTO public.sync_logs (operation, status, message, data, created_at)
    VALUES (
        'process_sync_event_atomic',
        'success',
        'Event processed atomically',
        jsonb_build_object(
            'event_id', p_event_id,
            'event_type', p_event_type,
            'booking_id', p_booking_id,
            'new_status', p_new_status
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'sync_event_id', v_sync_event_id,
        'event_id', p_event_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO public.sync_logs (operation, status, error_details, created_at)
    VALUES (
        'process_sync_event_atomic',
        'error',
        jsonb_build_object(
            'error', SQLERRM,
            'error_state', SQLSTATE,
            'event_id', p_event_id,
            'event_type', p_event_type
        ),
        now()
    );
    -- Re-raise the exception to rollback the transaction
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_sync_event_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_sync_event_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION process_sync_event_atomic IS 'Atomically processes blockchain sync events: inserts event, updates booking status, and marks as processed in a single transaction.';
