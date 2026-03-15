-- =============================================================================
-- ROAM — Comprehensive waitlist fix (P0 Bug 2)
--
-- Root cause: Anon INSERT with `Prefer: return=representation` requires BOTH
-- INSERT and SELECT RLS policies. If the SELECT policy wasn't applied,
-- the insert succeeds but PostgREST returns 403, causing the form to fail.
--
-- This migration is fully idempotent and ensures:
-- 1. All columns exist (referral_source, referral_code, referral_count, referred_by)
-- 2. Safe hash function (BIGINT, no overflow)
-- 3. All RLS policies (INSERT + SELECT for anon)
-- 4. All triggers (referral_code gen + referral crediting)
-- =============================================================================

-- ─── 1. Ensure all columns ─────────────────────────────────────────────────

ALTER TABLE public.waitlist_emails
  ADD COLUMN IF NOT EXISTS referral_source TEXT;

ALTER TABLE public.waitlist_emails
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

ALTER TABLE public.waitlist_emails
  ADD COLUMN IF NOT EXISTS referral_count BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.waitlist_emails
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Ensure referral_count is BIGINT (may have been INT from older migration)
ALTER TABLE public.waitlist_emails
  ALTER COLUMN referral_count TYPE BIGINT;

-- Unique constraint on referral_code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'waitlist_emails_referral_code_key'
  ) THEN
    ALTER TABLE public.waitlist_emails
      ADD CONSTRAINT waitlist_emails_referral_code_key UNIQUE (referral_code);
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_referral_code ON public.waitlist_emails(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_referred_by ON public.waitlist_emails(referred_by);
CREATE INDEX IF NOT EXISTS idx_waitlist_emails_created ON public.waitlist_emails(created_at DESC);

-- ─── 2. Safe hash function (BIGINT, no overflow) ───────────────────────────

CREATE OR REPLACE FUNCTION public.waitlist_referral_code(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  chars     TEXT := 'abcdefghjkmnpqrstuvwxyz23456789';
  h         BIGINT := 0;
  ascii_val BIGINT;
  i         INT;
  result    TEXT := '';
BEGIN
  FOR i IN 1..length(lower(trim(p_email))) LOOP
    ascii_val := ascii(substring(lower(trim(p_email)) FROM i FOR 1));
    h := mod(h * 31 + ascii_val, 2147483647);
  END LOOP;

  FOR i IN 1..6 LOOP
    result := result || substring(chars FROM (mod(h, length(chars))::INT + 1) FOR 1);
    h := h / length(chars);
  END LOOP;

  RETURN result;
END;
$$;

-- ─── 3. Triggers ────────────────────────────────────────────────────────────

-- Set referral_code on insert
CREATE OR REPLACE FUNCTION public.set_waitlist_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.waitlist_referral_code(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_waitlist_referral_code ON public.waitlist_emails;
CREATE TRIGGER trg_set_waitlist_referral_code
  BEFORE INSERT ON public.waitlist_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.set_waitlist_referral_code();

-- Credit referrer on waitlist join
CREATE OR REPLACE FUNCTION public.credit_referrer_on_waitlist_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_referrer_email TEXT;
BEGIN
  -- Check referred_by first (explicit referral code), fall back to referral_source
  v_code := lower(trim(COALESCE(NEW.referred_by, NEW.referral_source)));

  -- Skip generic sources
  IF v_code IS NULL OR v_code = '' OR v_code IN ('direct', 'share', 'twitter') THEN
    RETURN NEW;
  END IF;

  -- Credit the referrer
  SELECT email INTO v_referrer_email
  FROM public.waitlist_emails
  WHERE referral_code = v_code
    AND email != NEW.email
  LIMIT 1;

  IF v_referrer_email IS NOT NULL THEN
    UPDATE public.waitlist_emails
    SET referral_count = referral_count + 1
    WHERE referral_code = v_code;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_referrer_on_waitlist ON public.waitlist_emails;
CREATE TRIGGER trg_credit_referrer_on_waitlist
  AFTER INSERT ON public.waitlist_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_referrer_on_waitlist_insert();

-- ─── 4. RLS policies (idempotent) ──────────────────────────────────────────

ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;

-- Anon INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'waitlist_emails'
      AND policyname = 'Anon can insert waitlist'
  ) THEN
    CREATE POLICY "Anon can insert waitlist" ON public.waitlist_emails
      FOR INSERT TO anon
      WITH CHECK (true);
  END IF;
END$$;

-- Anon SELECT (CRITICAL: needed for Prefer: return=representation to work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'waitlist_emails'
      AND policyname = 'Anon can read waitlist rows'
  ) THEN
    CREATE POLICY "Anon can read waitlist rows" ON public.waitlist_emails
      FOR SELECT TO anon
      USING (true);
  END IF;
END$$;

-- Authenticated SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'waitlist_emails'
      AND policyname = 'Authenticated read waitlist'
  ) THEN
    CREATE POLICY "Authenticated read waitlist" ON public.waitlist_emails
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END$$;

-- Service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'waitlist_emails'
      AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access" ON public.waitlist_emails
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;
