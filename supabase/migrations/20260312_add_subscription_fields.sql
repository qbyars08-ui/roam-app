-- =============================================================================
-- Add subscription tracking fields to profiles table
-- Used by RevenueCat webhook to record purchase details server-side
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_product_id TEXT;

-- Index for finding expiring subscriptions (used by future churn prevention)
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires
  ON profiles (subscription_expires_at)
  WHERE subscription_tier = 'pro';
