-- =============================================================================
-- ROAM — Onboarding A/B Test (3 variants)
-- Assign new users to control, variant_a, variant_b and track conversions
-- =============================================================================

CREATE TABLE IF NOT EXISTS onboarding_ab_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'variant_a', 'variant_b')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_ab_session ON onboarding_ab_assignments(session_id);

CREATE INDEX idx_onboarding_ab_variant ON onboarding_ab_assignments(variant);
CREATE INDEX idx_onboarding_ab_created ON onboarding_ab_assignments(created_at DESC);

ALTER TABLE onboarding_ab_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert ab assignments" ON onboarding_ab_assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access" ON onboarding_ab_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
