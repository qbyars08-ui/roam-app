-- =============================================================================
-- ROAM — Chaos "Dare" share links
-- =============================================================================

CREATE TABLE IF NOT EXISTS chaos_dares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL,
  days INT NOT NULL,
  budget TEXT NOT NULL,
  vibes TEXT[] NOT NULL DEFAULT '{}',
  itinerary_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chaos_dares_created ON chaos_dares(created_at DESC);

ALTER TABLE chaos_dares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chaos dares" ON chaos_dares
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert chaos dares" ON chaos_dares
  FOR INSERT WITH CHECK (true);
