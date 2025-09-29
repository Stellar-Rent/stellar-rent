-- Migration: Create sync tables for blockchain synchronization
-- This migration adds tables to track blockchain events and sync state

-- Create sync_state table to track synchronization progress
CREATE TABLE IF NOT EXISTS public.sync_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_processed_block BIGINT NOT NULL DEFAULT 0,
    total_events_processed INTEGER NOT NULL DEFAULT 0,
    failed_events INTEGER NOT NULL DEFAULT 0,
    last_sync_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create sync_events table to track all blockchain events
CREATE TABLE IF NOT EXISTS public.sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL CHECK (event_type IN ('booking_created', 'booking_updated', 'booking_cancelled', 'payment_confirmed', 'property_created', 'property_updated', 'escrow_created', 'escrow_released')),
    booking_id TEXT,
    property_id TEXT,
    user_id TEXT,
    event_data JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_event_type CHECK (event_type IN ('booking_created', 'booking_updated', 'booking_cancelled', 'payment_confirmed', 'property_created', 'property_updated', 'escrow_created', 'escrow_released'))
);

-- Create sync_logs table for detailed logging
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
    message TEXT,
    data JSONB,
    error_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sync_events_event_type_idx ON public.sync_events(event_type);
CREATE INDEX IF NOT EXISTS sync_events_processed_idx ON public.sync_events(processed);
CREATE INDEX IF NOT EXISTS sync_events_created_at_idx ON public.sync_events(created_at);
CREATE INDEX IF NOT EXISTS sync_events_booking_id_idx ON public.sync_events(booking_id);
CREATE INDEX IF NOT EXISTS sync_events_property_id_idx ON public.sync_events(property_id);
CREATE INDEX IF NOT EXISTS sync_events_user_id_idx ON public.sync_events(user_id);

CREATE INDEX IF NOT EXISTS sync_logs_operation_idx ON public.sync_logs(operation);
CREATE INDEX IF NOT EXISTS sync_logs_status_idx ON public.sync_logs(status);
CREATE INDEX IF NOT EXISTS sync_logs_created_at_idx ON public.sync_logs(created_at);

-- Insert initial sync state
INSERT INTO public.sync_state (id, last_processed_block, total_events_processed, failed_events)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sync_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sync_state_updated_at
    BEFORE UPDATE ON public.sync_state
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_updated_at_column();

-- Add RLS policies for sync tables (if RLS is enabled)
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admin access to sync_state" ON public.sync_state
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin access to sync_events" ON public.sync_events
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin access to sync_logs" ON public.sync_logs
    FOR ALL USING (auth.role() = 'admin');

-- Create view for sync dashboard
CREATE OR REPLACE VIEW public.sync_dashboard AS
SELECT 
    s.last_processed_block,
    s.total_events_processed,
    s.failed_events,
    s.last_sync_time,
    s.updated_at as last_updated,
    COUNT(se.id) as total_events,
    COUNT(CASE WHEN se.processed = false THEN 1 END) as pending_events,
    COUNT(CASE WHEN se.processed = false AND se.error IS NOT NULL THEN 1 END) as failed_events_count,
    MAX(se.created_at) as last_event_time
FROM public.sync_state s
LEFT JOIN public.sync_events se ON true
GROUP BY s.id, s.last_processed_block, s.total_events_processed, s.failed_events, s.last_sync_time, s.updated_at;

-- Grant permissions
GRANT SELECT ON public.sync_dashboard TO authenticated;
GRANT ALL ON public.sync_state TO authenticated;
GRANT ALL ON public.sync_events TO authenticated;
GRANT ALL ON public.sync_logs TO authenticated; 