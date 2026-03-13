-- =============================================================================
-- ROAM — Waitlist referral codes + position
-- Guest flow: waitlist signups get their own code to share
-- =============================================================================

-- Add referral_code (their code to share) and referral_count (for waitlist-to-waitlist)
ALTER TABLE public.waitlist_emails
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_waitlist_emails_referral_code ON public.waitlist_emails(referral_code);

-- Function: generate 6-char code from email (deterministic)
CREATE OR REPLACE FUNCTION public.waitlist_referral_code(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  chars TEXT := 'abcdefghjkmnpqrstuvwxyz23456789';
  h INT := 0;
  i INT;
  result TEXT := '';
BEGIN
  FOR i IN 1..length(lower(trim(p_email))) LOOP
    h := ((h << 5) - h + ascii(substring(lower(trim(p_email)) from i for 1))) | 0;
  END LOOP;
  h := abs(h);
  FOR i IN 1..6 LOOP
    result := result || substring(chars from (mod(h, length(chars)) + 1) for 1);
    h := h / length(chars);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger: set referral_code on insert if null
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

-- Function: credit WAITLIST referrer when someone joins with ?ref=
-- Signed-in referrers are credited by credit_referrer_on_signup when referred user signs up.
-- Waitlist-only referrers get credited here (they have no user_id).
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
  v_code := lower(trim(NEW.referral_source));

  -- Skip generic sources
  IF v_code IS NULL OR v_code = '' OR v_code IN ('direct', 'share', 'twitter') THEN
    RETURN NEW;
  END IF;

  -- Only credit waitlist-only referrers (no user_id). Signed-in referrers credited on signup.
  SELECT email INTO v_referrer_email
  FROM public.waitlist_emails
  WHERE referral_code = v_code
    AND email != NEW.email  -- no self-referral
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
  WHEN (NEW.referral_source IS NOT NULL AND NEW.referral_source NOT IN ('direct', 'share', 'twitter'))
  EXECUTE FUNCTION public.credit_referrer_on_waitlist_insert();
