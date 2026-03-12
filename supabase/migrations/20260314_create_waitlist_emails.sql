-- =============================================================================
-- ROAM — Waitlist emails (landing page signups)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.waitlist_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  referral_source TEXT,         -- ?ref= param from URL
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_emails_email_unique UNIQUE (email)
);

-- Index for fast duplicate checks + analytics queries
CREATE INDEX idx_waitlist_emails_created ON public.waitlist_emails(created_at DESC);

-- RLS — open insert (anon users from landing page), service role reads
ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;

-- Anyone can sign up (landing page uses anon key)
CREATE POLICY "Anyone can insert waitlist email" ON public.waitlist_emails
  FOR INSERT
  WITH CHECK (true);

-- Only service role can read/manage (admin dashboard)
CREATE POLICY "Service role full access" ON public.waitlist_emails
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
