-- =============================================================================
-- ROAM — Fix waitlist_referral_code integer overflow
-- Replaces bit-shift hash (overflows INT) with modular arithmetic using BIGINT
-- Also ensures referral_source column exists (may be absent if 20260322 ran first)
-- =============================================================================

-- Ensure referral_source column exists (client inserts it; 20260322 schema omits it)
ALTER TABLE public.waitlist_emails
  ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Replace hash function: use BIGINT + mod arithmetic instead of bit shifts
-- The original JS: h = ((h << 5) - h + char) | 0  overflows PostgreSQL INT.
-- Equivalent safe formula: h = mod(h * 31 + char, 2147483647)
-- Output style is identical: 6 chars drawn from the same chars alphabet.
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
