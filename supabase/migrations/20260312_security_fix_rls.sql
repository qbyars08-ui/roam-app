-- =============================================================================
-- SECURITY FIX: Replace dangerous `true` RLS policies with proper ownership checks
-- Date: 2026-03-12
-- Severity: CRITICAL — these policies allowed any authenticated user to
-- insert/update ANY row in these tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. squad_matches — INSERT was `true`, anyone could fake a match
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated insert squad_matches" ON squad_matches;
CREATE POLICY "Users insert own matches" ON squad_matches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (user_a, user_b));

-- ---------------------------------------------------------------------------
-- 2. hostel_channels — INSERT was `true`, anyone could create channels
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated insert hostel_channels" ON hostel_channels;
CREATE POLICY "Authenticated users create channels" ON hostel_channels
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- 3. nightlife_groups — ALL was `true` for both USING and WITH CHECK
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated join nightlife" ON nightlife_groups;
CREATE POLICY "Members read nightlife groups" ON nightlife_groups
  FOR SELECT TO authenticated
  USING (auth.uid() = ANY(member_ids) OR auth.uid() = created_by);

CREATE POLICY "Users create nightlife groups" ON nightlife_groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators update nightlife groups" ON nightlife_groups
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- 4. safety_alerts — INSERT was `true`, anyone could insert alerts
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated insert safety_alerts" ON safety_alerts;
CREATE POLICY "Users create own safety alerts" ON safety_alerts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = triggered_by);

-- ---------------------------------------------------------------------------
-- 5. social_chat_channels — INSERT and UPDATE were `true`
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated insert social_chat_channels" ON social_chat_channels;
DROP POLICY IF EXISTS "Authenticated update social_chat_channels" ON social_chat_channels;

CREATE POLICY "Members create chat channels" ON social_chat_channels
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ANY(member_ids));

CREATE POLICY "Members update chat channels" ON social_chat_channels
  FOR UPDATE TO authenticated
  USING (auth.uid() = ANY(member_ids))
  WITH CHECK (auth.uid() = ANY(member_ids));

-- ---------------------------------------------------------------------------
-- 6. prompt_versions — ALL operations were `true` (read-only reference table)
-- Lock down to SELECT-only for authenticated, no writes from client
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read prompt_versions" ON prompt_versions;
DROP POLICY IF EXISTS "Anyone can insert prompt_versions" ON prompt_versions;
DROP POLICY IF EXISTS "Anyone can update prompt_versions" ON prompt_versions;
DROP POLICY IF EXISTS "Anyone can delete prompt_versions" ON prompt_versions;
-- Drop any FOR ALL policy
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'prompt_versions' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON prompt_versions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Read-only prompt versions" ON prompt_versions
  FOR SELECT TO authenticated
  USING (true);

-- Writes to prompt_versions should only happen via service_role (admin/migrations)

-- ---------------------------------------------------------------------------
-- 7. Restrict referral_codes anonymous read (info leak)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can lookup codes" ON referral_codes;
CREATE POLICY "Authenticated users lookup codes" ON referral_codes
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- 8. Add CORS origin restriction note (applied in edge function code)
-- ---------------------------------------------------------------------------
-- Note: CORS restriction to roam.app must be applied in edge function code,
-- not in SQL. See supabase/functions/*/index.ts.

-- ---------------------------------------------------------------------------
-- Done. All critical RLS vulnerabilities patched.
-- ---------------------------------------------------------------------------
