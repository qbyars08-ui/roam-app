-- =============================================================================
-- ROAM — Waitlist table
-- Collects emails from invited friends + organic signups
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  referral_code TEXT,
  source TEXT DEFAULT 'app_invite',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'joined', 'declined')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral ON public.waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist(created_at DESC);

-- RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public signup)
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can read (for admin)
CREATE POLICY "Authenticated users can read waitlist" ON public.waitlist
  FOR SELECT USING (auth.role() = 'authenticated');

-- Comment
COMMENT ON TABLE public.waitlist IS 'Email waitlist for ROAM beta access';
