-- =============================================================================
-- ROAM — Referral Flow End-to-End
-- 1. Generate unique code for every user (via trigger + app)
-- 2. waitlist stores ?ref= in referral_source (already exists)
-- 3. When referred user signs up — credit referrer automatically
-- 4. 3 refs = 1 month Pro, 10 refs = 1 year Pro
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add referral_credited_at to waitlist_emails (avoid double-credit)
-- ---------------------------------------------------------------------------
ALTER TABLE public.waitlist_emails
  ADD COLUMN IF NOT EXISTS referral_credited_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.waitlist_emails.referral_credited_at IS
  'Set when referred user signs up and referrer is credited';

-- ---------------------------------------------------------------------------
-- 2. Add Pro-from-referrals columns to profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pro_months_from_referrals INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_referral_expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.profiles.pro_months_from_referrals IS
  'Total Pro months earned from referrals (3 refs = 1 mo, 10 refs = 12 mo)';
COMMENT ON COLUMN public.profiles.pro_referral_expires_at IS
  'When referral-earned Pro access expires';

-- ---------------------------------------------------------------------------
-- 3. Function: credit referrer when referred user signs up
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_referrer_on_signup(p_user_id UUID, p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_waitlist RECORD;
  v_referrer_id UUID;
  v_new_count INT;
  v_months_earned INT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_email := lower(trim(coalesce(p_email, '')));

  IF v_email = '' THEN
    RETURN;
  END IF;

  -- Find uncredited waitlist row with valid referral
  SELECT id, referral_source
  INTO v_waitlist
  FROM public.waitlist_emails
  WHERE email = v_email
    AND referral_credited_at IS NULL
    AND referral_source IS NOT NULL
    AND referral_source != ''
    AND referral_source != 'direct'
    AND referral_source != 'share'
    AND referral_source != 'twitter'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Look up referrer by code
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = lower(trim(v_waitlist.referral_source))
  LIMIT 1;

  IF v_referrer_id IS NULL OR v_referrer_id = p_user_id THEN
    -- Invalid code or self-referral: mark as credited to avoid retries
    UPDATE public.waitlist_emails
    SET referral_credited_at = now()
    WHERE id = v_waitlist.id;
    RETURN;
  END IF;

  -- Increment referrer's count (upsert referral_codes if needed)
  INSERT INTO public.referral_codes (user_id, code, referral_count, free_trips_earned)
  VALUES (v_referrer_id, lower(trim(v_waitlist.referral_source)), 1, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET
    referral_count = referral_codes.referral_count + 1,
    free_trips_earned = referral_codes.free_trips_earned + 1;

  -- Get new count
  SELECT referral_count INTO v_new_count
  FROM public.referral_codes
  WHERE user_id = v_referrer_id;

  -- Grant Pro: 3 refs = 1 month, 10 refs = 1 year (12 months total)
  v_months_earned := CASE
    WHEN v_new_count >= 10 THEN 12
    WHEN v_new_count >= 3 THEN v_new_count / 3
    ELSE 0
  END;

  IF v_months_earned > 0 THEN
    SELECT pro_referral_expires_at INTO v_expires_at
    FROM public.profiles
    WHERE id = v_referrer_id;

    v_expires_at := coalesce(greatest(v_expires_at, now()), now())
      + (v_months_earned || ' months')::interval;

    UPDATE public.profiles
    SET
      pro_months_from_referrals = v_months_earned,
      pro_referral_expires_at = v_expires_at,
      subscription_tier = CASE WHEN v_months_earned > 0 THEN 'pro' ELSE subscription_tier END,
      updated_at = now()
    WHERE id = v_referrer_id;
  END IF;

  -- Mark waitlist row as credited
  UPDATE public.waitlist_emails
  SET referral_credited_at = now()
  WHERE id = v_waitlist.id;

  RETURN;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Update handle_new_user to credit referrer (code creation done in app)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, subscription_tier, trips_generated_this_month, month_reset_at)
  VALUES (NEW.id, 'free', 0, now())
  ON CONFLICT (id) DO NOTHING;

  -- Credit referrer if this user came from waitlist with ?ref=
  PERFORM public.credit_referrer_on_signup(
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'email', NEW.email)
  );

  RETURN NEW;
END;
$$;
