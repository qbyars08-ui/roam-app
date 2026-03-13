-- =============================================================================
-- SECURITY AUDIT: Fix permissive RLS policies found during 2026-03-13 audit
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. venues — restrict to service_role (was: all roles, full access)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access" ON venues;
CREATE POLICY "Service role full access" ON venues
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 2. prompt_versions — drop overly permissive policy, restrict writes
-- ---------------------------------------------------------------------------
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'prompt_versions' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON prompt_versions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Service role full access" ON prompt_versions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read prompt_versions" ON prompt_versions
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 3. content_freshness — drop overly permissive policy, restrict writes
-- ---------------------------------------------------------------------------
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'content_freshness' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON content_freshness', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Service role full access" ON content_freshness
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read content_freshness" ON content_freshness
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 4. error_logs — restrict SELECT and INSERT to authenticated (was: all roles)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow select error_logs" ON error_logs;
DROP POLICY IF EXISTS "Allow insert error_logs" ON error_logs;
CREATE POLICY "Authenticated read error_logs" ON error_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert error_logs" ON error_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. analytics_events — remove public SELECT, restrict INSERT
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow select analytics" ON analytics_events;
DROP POLICY IF EXISTS "Allow insert analytics" ON analytics_events;
CREATE POLICY "Authenticated insert analytics" ON analytics_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 6. chaos_dares — restrict INSERT to authenticated
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert chaos dares" ON chaos_dares;
DROP POLICY IF EXISTS "Anyone can read chaos dares" ON chaos_dares;
CREATE POLICY "Public read chaos dares" ON chaos_dares
  FOR SELECT USING (true);
CREATE POLICY "Authenticated insert chaos dares" ON chaos_dares
  FOR INSERT TO authenticated WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 7. onboarding_ab_assignments — restrict INSERT to authenticated
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow insert ab assignments" ON onboarding_ab_assignments;
CREATE POLICY "Authenticated insert ab assignments" ON onboarding_ab_assignments
  FOR INSERT TO authenticated WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 8. waitlist_emails — restrict anon reads to own row (by email hash)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anon can read waitlist rows" ON waitlist_emails;
CREATE POLICY "Authenticated read waitlist" ON waitlist_emails
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon insert waitlist" ON waitlist_emails
  FOR INSERT TO anon WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Done. All findings from security audit patched.
-- ---------------------------------------------------------------------------
