-- =============================================================================
-- ROAM — Waitlist emails (public.waitlist_emails)
-- Columns: id, email (unique), created_at, referral_code, referred_by
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.waitlist_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  referral_code TEXT,
  referred_by TEXT,
  CONSTRAINT waitlist_emails_email_unique UNIQUE (email)
);

-- Add columns if table pre-existed from prior migrations
ALTER TABLE public.waitlist_emails ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.waitlist_emails ADD COLUMN IF NOT EXISTS referred_by TEXT;
