-- =============================================================================
-- ROAM — Self-improvement: Analytics events
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  screen TEXT,
  action TEXT,
  payload JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_screen ON analytics_events(screen);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_payload ON analytics_events USING GIN (payload);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access" ON analytics_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin dashboard read access
CREATE POLICY "Allow select analytics" ON analytics_events
  FOR SELECT USING (true);
