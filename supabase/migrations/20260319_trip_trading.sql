-- =============================================================================
-- ROAM — Trip Trading: Public trips users can browse and claim
-- =============================================================================

ALTER TABLE shared_trips ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE shared_trips ADD COLUMN IF NOT EXISTS allow_claim BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE shared_trips ADD COLUMN IF NOT EXISTS claim_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_shared_trips_public ON shared_trips(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_shared_trips_allow_claim ON shared_trips(allow_claim, created_at DESC) WHERE allow_claim = true;

-- Track claims for analytics
CREATE TABLE IF NOT EXISTS trip_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_trip_id UUID NOT NULL REFERENCES shared_trips(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_claims_shared ON trip_claims(shared_trip_id);
CREATE INDEX idx_trip_claims_claimant ON trip_claims(claimant_id);

ALTER TABLE trip_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert claims" ON trip_claims
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = claimant_id);

CREATE POLICY "Service role full access" ON trip_claims
  FOR ALL TO service_role USING (true) WITH CHECK (true);
