-- =============================================================================
-- ROAM — Referral Codes
-- Stores referral codes, tracks referral counts, and earned free trips.
-- =============================================================================

-- Referral system
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  code TEXT NOT NULL UNIQUE,
  referral_count INT NOT NULL DEFAULT 0,
  free_trips_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can read their own code
CREATE POLICY "Users can read own referral" ON referral_codes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own code
CREATE POLICY "Users can create own referral" ON referral_codes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own code
CREATE POLICY "Users can update own referral" ON referral_codes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can look up a code (for validating referral links)
CREATE POLICY "Anyone can lookup codes" ON referral_codes
  FOR SELECT TO anon
  USING (true);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
