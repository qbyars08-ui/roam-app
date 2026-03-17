-- =============================================================================
-- ROAM — Sonar cache table (Perplexity Sonar live travel intelligence)
-- 6-hour TTL, keyed by destination + query type
-- =============================================================================

CREATE TABLE IF NOT EXISTS sonar_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  destination TEXT NOT NULL,
  query_type TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Unique constraint for upserts
CREATE UNIQUE INDEX idx_sonar_cache_unique
  ON sonar_cache (destination, query_type);

-- Fast lookup by destination + type + expiry
CREATE INDEX idx_sonar_cache_lookup
  ON sonar_cache (destination, query_type, expires_at);

-- RLS
ALTER TABLE sonar_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read"
  ON sonar_cache FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages"
  ON sonar_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
