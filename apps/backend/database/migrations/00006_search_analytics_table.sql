-- Search Analytics Table Migration
-- This migration adds a table to track search performance and user behavior

-- Create search_analytics table
CREATE TABLE IF NOT EXISTS public.search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    results_count INTEGER NOT NULL DEFAULT 0,
    search_time_ms INTEGER NOT NULL DEFAULT 0,
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp 
ON public.search_analytics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query 
ON public.search_analytics(query);

CREATE INDEX IF NOT EXISTS idx_search_analytics_search_time 
ON public.search_analytics(search_time_ms DESC);

CREATE INDEX IF NOT EXISTS idx_search_analytics_cached 
ON public.search_analytics(cached);

CREATE INDEX IF NOT EXISTS idx_search_analytics_session 
ON public.search_analytics(session_id);

-- Create composite index for time-based queries
CREATE INDEX IF NOT EXISTS idx_search_analytics_time_query 
ON public.search_analytics(timestamp DESC, query);

-- Create index for performance analysis
CREATE INDEX IF NOT EXISTS idx_search_analytics_performance 
ON public.search_analytics(search_time_ms DESC, timestamp DESC);

-- Create function to clean up old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_search_analytics(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.search_analytics 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get search performance metrics
CREATE OR REPLACE FUNCTION get_search_performance_metrics(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_searches BIGINT,
    avg_search_time NUMERIC,
    cache_hit_rate NUMERIC,
    slow_queries_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_searches,
        AVG(search_time_ms) as avg_search_time,
        (COUNT(*) FILTER (WHERE cached = TRUE) * 100.0 / COUNT(*)) as cache_hit_rate,
        COUNT(*) FILTER (WHERE search_time_ms > 500) as slow_queries_count
    FROM public.search_analytics
    WHERE timestamp >= NOW() - INTERVAL '1 hour' * hours_back;
END;
$$ LANGUAGE plpgsql;

-- Create function to get popular search queries
CREATE OR REPLACE FUNCTION get_popular_search_queries(
    limit_count INTEGER DEFAULT 10,
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    query TEXT,
    search_count BIGINT,
    avg_search_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.query,
        COUNT(*) as search_count,
        AVG(sa.search_time_ms) as avg_search_time
    FROM public.search_analytics sa
    WHERE sa.timestamp >= NOW() - INTERVAL '1 hour' * hours_back
    GROUP BY sa.query
    ORDER BY search_count DESC, avg_search_time ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get search trends by hour
CREATE OR REPLACE FUNCTION get_search_trends_by_hour(
    days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    hour_of_day INTEGER,
    search_count BIGINT,
    avg_search_time NUMERIC,
    cache_hit_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM timestamp)::INTEGER as hour_of_day,
        COUNT(*) as search_count,
        AVG(search_time_ms) as avg_search_time,
        (COUNT(*) FILTER (WHERE cached = TRUE) * 100.0 / COUNT(*)) as cache_hit_rate
    FROM public.search_analytics
    WHERE timestamp >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY EXTRACT(HOUR FROM timestamp)
    ORDER BY hour_of_day;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for daily search statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_search_stats AS
SELECT 
    DATE(timestamp) as search_date,
    COUNT(*) as total_searches,
    AVG(search_time_ms) as avg_search_time,
    COUNT(*) FILTER (WHERE cached = TRUE) as cached_searches,
    COUNT(*) FILTER (WHERE search_time_ms > 500) as slow_searches,
    COUNT(DISTINCT session_id) as unique_sessions
FROM public.search_analytics
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY search_date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_daily_search_stats_date 
ON daily_search_stats(search_date DESC);

-- Create function to refresh daily stats
CREATE OR REPLACE FUNCTION refresh_daily_search_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_search_stats;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to refresh daily stats (runs every hour)
SELECT cron.schedule(
    'refresh-daily-search-stats',
    '0 * * * *',
    'SELECT refresh_daily_search_stats();'
);

-- Create scheduled job to cleanup old analytics (runs daily at 2 AM)
SELECT cron.schedule(
    'cleanup-old-search-analytics',
    '0 2 * * *',
    'SELECT cleanup_old_search_analytics(30);'
);

-- Enable Row Level Security
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage search_analytics" ON public.search_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.search_analytics TO service_role;
GRANT ALL ON daily_search_stats TO service_role;

-- Add migration record
INSERT INTO migrations (name) VALUES ('00006_search_analytics_table')
ON CONFLICT (name) DO NOTHING; 