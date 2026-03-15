-- =============================================================================
-- SECURITY FIX: waitlist_emails — drop broad anon SELECT policy
--
-- Root cause: 20260325000001_waitlist_comprehensive_fix.sql re-introduced
-- "Anon can read waitlist rows" with USING (true), meaning any anonymous
-- user could execute SELECT * FROM waitlist_emails and dump all emails.
-- This was also present as "Anon can read own waitlist row" in
-- 20260323000003_waitlist_referral_tracking.sql — also WITH USING (true).
--
-- Severity: CRITICAL — all waitlist emails are publicly readable
--
-- Fix:
-- 1. Drop both broad anon SELECT policies
-- 2. Add SECURITY DEFINER RPC `join_waitlist` that handles insert + return
--    atomically without requiring a SELECT policy for anon
-- =============================================================================

-- ─── 1. Drop broad anon SELECT policies ─────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read waitlist rows" ON public.waitlist_emails;
DROP POLICY IF EXISTS "Anon can read own waitlist row" ON public.waitlist_emails;

-- ─── 2. Ensure remaining policies are correct ────────────────────────────────
-- Anon INSERT: needed for landing page signups
DROP POLICY IF EXISTS "Anon can insert waitlist" ON public.waitlist_emails;
CREATE POLICY "Anon can insert waitlist" ON public.waitlist_emails
  FOR INSERT TO anon
  WITH CHECK (true);

-- Anon cannot SELECT — all reads go through join_waitlist() RPC
-- Authenticated users retain read access (admin dashboard)
DROP POLICY IF EXISTS "Authenticated read waitlist" ON public.waitlist_emails;
CREATE POLICY "Authenticated read waitlist" ON public.waitlist_emails
  FOR SELECT TO authenticated
  USING (true);

-- ─── 3. SECURITY DEFINER RPC: join_waitlist ──────────────────────────────────
-- This function replaces the direct .insert().select() pattern used by
-- lib/waitlist-guest.ts. It runs as the postgres superuser (SECURITY DEFINER),
-- inserts the email, and returns only the caller's own row data.
-- No SELECT policy needed for anon — the function bypasses RLS internally.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_email TEXT,
  p_referral_source TEXT DEFAULT 'direct'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_safe_ref TEXT;
  v_existing jsonb;
  v_new_row waitlist_emails%ROWTYPE;
  v_position BIGINT;
BEGIN
  -- Validate + normalise email
  v_email := lower(trim(p_email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF length(v_email) > 254 THEN
    RAISE EXCEPTION 'Email too long';
  END IF;
  IF v_email !~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Sanitise referral source
  v_safe_ref := lower(trim(COALESCE(p_referral_source, 'direct')));
  IF length(v_safe_ref) > 50 THEN
    v_safe_ref := 'direct';
  END IF;

  -- Check for duplicate
  SELECT jsonb_build_object(
    'referral_code', we.referral_code,
    'created_at',    we.created_at
  )
  INTO v_existing
  FROM public.waitlist_emails we
  WHERE we.email = v_email;

  IF v_existing IS NOT NULL THEN
    -- Return existing row data without error (idempotent signup)
    SELECT COUNT(*) INTO v_position
    FROM public.waitlist_emails
    WHERE created_at <= (v_existing->>'created_at')::timestamptz;

    RETURN jsonb_build_object(
      'referral_code', v_existing->>'referral_code',
      'created_at',    v_existing->>'created_at',
      'position',      v_position
    );
  END IF;

  -- Insert new row (trigger will set referral_code)
  INSERT INTO public.waitlist_emails (email, referral_source)
  VALUES (v_email, v_safe_ref)
  RETURNING * INTO v_new_row;

  -- Count position
  SELECT COUNT(*) INTO v_position
  FROM public.waitlist_emails
  WHERE created_at <= v_new_row.created_at;

  RETURN jsonb_build_object(
    'referral_code', v_new_row.referral_code,
    'created_at',    v_new_row.created_at,
    'position',      v_position
  );
END;
$$;

-- Grant to anon so landing page can call it without authentication
GRANT EXECUTE ON FUNCTION public.join_waitlist(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.join_waitlist(TEXT, TEXT) TO authenticated;
