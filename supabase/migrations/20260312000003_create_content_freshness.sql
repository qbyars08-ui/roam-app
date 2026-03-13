-- =============================================================================
-- ROAM — Self-improvement: Content freshness
-- =============================================================================

CREATE TABLE IF NOT EXISTS content_freshness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key TEXT NOT NULL UNIQUE,
  destination TEXT,
  data_type TEXT NOT NULL,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_freshness_key ON content_freshness(content_key);
CREATE INDEX idx_content_freshness_destination ON content_freshness(destination);
CREATE INDEX idx_content_freshness_updated ON content_freshness(last_updated_at DESC);

ALTER TABLE content_freshness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON content_freshness
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read content_freshness" ON content_freshness
  FOR SELECT TO authenticated USING (true);
