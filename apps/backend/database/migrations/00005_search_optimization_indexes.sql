-- Search Optimization Indexes Migration
-- This migration adds performance-optimized indexes for property search

-- 1. Spatial Index for location-based searches
CREATE INDEX IF NOT EXISTS idx_properties_location_spatial 
ON public.properties USING GIST (
    ll_to_earth(latitude, longitude)
);

-- 2. Composite indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_properties_search_composite 
ON public.properties (city, country, status, price) 
WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_properties_price_location 
ON public.properties (price, city, country) 
WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_properties_amenities_price 
ON public.properties USING GIN (amenities, price) 
WHERE status = 'available';

-- 3. Full-text search index for title and description
CREATE INDEX IF NOT EXISTS idx_properties_fulltext 
ON public.properties USING GIN (
    to_tsvector('english', title || ' ' || description)
);

-- 4. Date-based availability index
CREATE INDEX IF NOT EXISTS idx_properties_availability 
ON public.properties USING GIN (availability) 
WHERE status = 'available';

-- 5. Capacity-based search index
CREATE INDEX IF NOT EXISTS idx_properties_capacity 
ON public.properties (max_guests, bedrooms, bathrooms) 
WHERE status = 'available';

-- 6. Popular search combinations
CREATE INDEX IF NOT EXISTS idx_properties_popular_search 
ON public.properties (city, country, price, max_guests, bedrooms) 
WHERE status = 'available';

-- 7. Created date for sorting
CREATE INDEX IF NOT EXISTS idx_properties_created_sort 
ON public.properties (created_at DESC) 
WHERE status = 'available';

-- 8. Price range index for filtering
CREATE INDEX IF NOT EXISTS idx_properties_price_range 
ON public.properties (price) 
WHERE status = 'available' AND price > 0;

-- 9. Location text search index
CREATE INDEX IF NOT EXISTS idx_properties_location_text 
ON public.properties USING GIN (
    to_tsvector('english', city || ' ' || country)
);

-- 10. Property type categorization (based on amenities)
CREATE INDEX IF NOT EXISTS idx_properties_type_amenities 
ON public.properties USING GIN (amenities) 
WHERE status = 'available';

-- Create function for distance calculation
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, 
    lon1 DECIMAL, 
    lat2 DECIMAL, 
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        6371 * acos(
            cos(radians(lat1)) * 
            cos(radians(lat2)) * 
            cos(radians(lon2) - radians(lon1)) + 
            sin(radians(lat1)) * 
            sin(radians(lat2))
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function for search relevance scoring
CREATE OR REPLACE FUNCTION calculate_search_relevance(
    search_query TEXT,
    property_title TEXT,
    property_description TEXT,
    property_city TEXT,
    property_country TEXT
) RETURNS DECIMAL AS $$
DECLARE
    relevance_score DECIMAL := 0;
    query_lower TEXT := lower(search_query);
    title_lower TEXT := lower(property_title);
    desc_lower TEXT := lower(property_description);
    city_lower TEXT := lower(property_city);
    country_lower TEXT := lower(property_country);
BEGIN
    -- Exact matches get highest score
    IF title_lower = query_lower THEN relevance_score := relevance_score + 100; END IF;
    IF city_lower = query_lower THEN relevance_score := relevance_score + 90; END IF;
    IF country_lower = query_lower THEN relevance_score := relevance_score + 85; END IF;
    
    -- Prefix matches
    IF title_lower LIKE query_lower || '%' THEN relevance_score := relevance_score + 50; END IF;
    IF city_lower LIKE query_lower || '%' THEN relevance_score := relevance_score + 40; END IF;
    IF country_lower LIKE query_lower || '%' THEN relevance_score := relevance_score + 35; END IF;
    
    -- Contains matches
    IF title_lower LIKE '%' || query_lower || '%' THEN relevance_score := relevance_score + 30; END IF;
    IF desc_lower LIKE '%' || query_lower || '%' THEN relevance_score := relevance_score + 20; END IF;
    IF city_lower LIKE '%' || query_lower || '%' THEN relevance_score := relevance_score + 25; END IF;
    IF country_lower LIKE '%' || query_lower || '%' THEN relevance_score := relevance_score + 20; END IF;
    
    -- Prefer shorter names (more specific)
    relevance_score := relevance_score - (length(property_title) * 0.1);
    
    RETURN GREATEST(relevance_score, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function for availability checking
CREATE OR REPLACE FUNCTION is_property_available(
    property_id UUID,
    check_in_date DATE,
    check_out_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
    property_availability JSONB;
    range_record JSONB;
    range_start DATE;
    range_end DATE;
BEGIN
    -- Get property availability
    SELECT availability INTO property_availability 
    FROM properties 
    WHERE id = property_id;
    
    -- If no availability data, property is available
    IF property_availability IS NULL OR jsonb_array_length(property_availability) = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Check each availability range
    FOR range_record IN SELECT * FROM jsonb_array_elements(property_availability)
    LOOP
        range_start := (range_record->>'from')::DATE;
        range_end := (range_record->>'to')::DATE;
        
        -- If dates overlap, property is not available
        IF check_in_date < range_end AND check_out_date > range_start THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create materialized view for popular searches
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_searches AS
SELECT 
    city,
    country,
    COUNT(*) as property_count,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM properties 
WHERE status = 'available'
GROUP BY city, country
HAVING COUNT(*) >= 2
ORDER BY property_count DESC, avg_price ASC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_popular_searches_location 
ON popular_searches (city, country);

CREATE INDEX IF NOT EXISTS idx_popular_searches_count 
ON popular_searches (property_count DESC);

-- Create function to refresh popular searches
CREATE OR REPLACE FUNCTION refresh_popular_searches()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW popular_searches;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to refresh popular searches (runs every hour)
SELECT cron.schedule(
    'refresh-popular-searches',
    '0 * * * *',
    'SELECT refresh_popular_searches();'
);

-- Add migration record
INSERT INTO migrations (name) VALUES ('00005_search_optimization_indexes')
ON CONFLICT (name) DO NOTHING; 