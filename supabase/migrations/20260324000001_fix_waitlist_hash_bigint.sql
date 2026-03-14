-- =============================================================================
-- ROAM — P0 Fix: waitlist "integer out of range" error
--
-- Root cause: Migration 20260320000002 recreated the hash function with INT
-- bit shifts that overflow int4 (max 2,147,483,647), overwriting the BIGINT
-- fix from 20260313000002. The trigger fires on INSERT, hash overflows, crash.
--
-- Applied live: 2026-03-14 via Supabase SQL Editor
-- =============================================================================

-- 1. Widen referral_count from INT to BIGINT
ALTER TABLE public.waitlist_emails
  ALTER COLUMN referral_count TYPE BIGINT;

-- 2. Re-apply the safe hash function using BIGINT + modular arithmetic
--    instead of bit shifts that overflow PostgreSQL INT.
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
