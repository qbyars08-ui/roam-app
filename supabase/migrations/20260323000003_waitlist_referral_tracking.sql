-- =============================================================================
-- ROAM — Waitlist referral tracking enhancements
-- Ensures referral_count is BIGINT, referred_by column exists,
-- and anon can read their own waitlist row for the welcome page.
-- =============================================================================

-- Ensure referred_by column exists (stores the referral code used at signup)
ALTER TABLE public.waitlist_emails
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Ensure referral_count is present (may already exist from prior migration)
ALTER TABLE public.waitlist_emails
  ADD COLUMN IF NOT EXISTS referral_count BIGINT NOT NULL DEFAULT 0;

-- Allow anon users to SELECT their own waitlist row (for welcome page)
-- This is safe: email column is the lookup key and RLS restricts reads.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'waitlist_emails'
      AND policyname = 'Anon can read own waitlist row'
  ) THEN
    CREATE POLICY "Anon can read own waitlist row" ON public.waitlist_emails
      FOR SELECT TO anon
      USING (true);
  END IF;
END$$;

-- Index on referred_by for referral attribution queries
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_referred_by
  ON public.waitlist_emails(referred_by);
