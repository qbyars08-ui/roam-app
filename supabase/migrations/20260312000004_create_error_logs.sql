-- =============================================================================
-- ROAM — Self-improvement: Error logs
-- =============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  screen TEXT,
  message TEXT,
  stack TEXT,
  payload JSONB DEFAULT '{}',
  occurrence_count INT NOT NULL DEFAULT 1,
  auto_fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_screen ON error_logs(screen);
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON error_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read error_logs" ON error_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert error_logs" ON error_logs
  FOR INSERT TO authenticated WITH CHECK (true);
