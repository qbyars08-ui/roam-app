-- =============================================================================
-- SECURITY FIX v2: Correct 3 bugs in 20260312000008_security_fix_rls.sql
--
-- Bug 1: hostel_channels DROP used underscores but original policy used spaces
--         → old permissive "Authenticated insert hostel channels" was never dropped
-- Bug 2: safety_alerts used `triggered_by` column — correct column is `user_id`
-- Bug 3: nightlife_groups used `created_by` column — column doesn't exist
--
-- This migration is idempotent: safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. hostel_channels — drop the ACTUAL permissive policy (with spaces)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated insert hostel channels" ON hostel_channels;
DROP POLICY IF EXISTS "Authenticated insert hostel_channels" ON hostel_channels;
-- Recreate with ownership check: only members can create channels
-- (hostel_channels has no user/owner column — keep authenticated-only guard)
DROP POLICY IF EXISTS "Authenticated users create channels" ON hostel_channels;
CREATE POLICY "Authenticated users create channels" ON hostel_channels
  FOR INSERT TO authenticated
  WITH CHECK (true);
-- Note: hostel_channels has no owner column. Membership is tracked in
-- hostel_memberships table. INSERT guard is "must be authenticated" (no anon).

-- ---------------------------------------------------------------------------
-- 2. safety_alerts — fix column name: `user_id`, not `triggered_by`
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users create own safety alerts" ON safety_alerts;
DROP POLICY IF EXISTS "System creates alerts" ON safety_alerts;
CREATE POLICY "Users create own safety alerts" ON safety_alerts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. nightlife_groups — fix: no `created_by` column, use `member_ids` array
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members read nightlife groups" ON nightlife_groups;
DROP POLICY IF EXISTS "Users create nightlife groups" ON nightlife_groups;
DROP POLICY IF EXISTS "Creators update nightlife groups" ON nightlife_groups;
DROP POLICY IF EXISTS "Nightlife groups readable" ON nightlife_groups;
DROP POLICY IF EXISTS "Authenticated join nightlife" ON nightlife_groups;

CREATE POLICY "Members read nightlife groups" ON nightlife_groups
  FOR SELECT TO authenticated
  USING (auth.uid() = ANY(member_ids));

CREATE POLICY "Authenticated create nightlife groups" ON nightlife_groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ANY(member_ids));

CREATE POLICY "Members update nightlife groups" ON nightlife_groups
  FOR UPDATE TO authenticated
  USING (auth.uid() = ANY(member_ids))
  WITH CHECK (auth.uid() = ANY(member_ids));

-- ---------------------------------------------------------------------------
-- 4. waitlist_emails — restrict anon SELECT (was open to all roles)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anon can read waitlist rows" ON waitlist_emails;
-- Only authenticated users need to read waitlist; anon can insert only
DROP POLICY IF EXISTS "Authenticated read waitlist" ON waitlist_emails;
CREATE POLICY "Authenticated read waitlist" ON waitlist_emails
  FOR SELECT TO authenticated
  USING (true);

-- Ensure anon can still insert (for guest waitlist signup)
DROP POLICY IF EXISTS "Anon insert waitlist" ON waitlist_emails;
CREATE POLICY "Anon insert waitlist" ON waitlist_emails
  FOR INSERT TO anon
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Done. All 3 HIGH + 1 MEDIUM security fix bugs corrected.
-- ---------------------------------------------------------------------------
