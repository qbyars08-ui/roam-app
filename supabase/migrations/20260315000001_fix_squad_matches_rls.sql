-- =============================================================================
-- SECURITY FIX: squad_matches INSERT policy referenced non-existent columns
--
-- Bug: 20260312000008_security_fix_rls.sql created a policy using columns
-- `user_a` and `user_b` which do not exist in squad_matches.
-- Actual columns are `initiator_id` and `target_id`.
--
-- Impact: The broken policy either failed at creation (leaving no INSERT policy
-- after the DROP) or failed at enforcement, allowing any authenticated user to
-- insert arbitrary matches between any pair of users.
--
-- Severity: CRITICAL — auth bypass on social matching
-- =============================================================================

-- Drop the broken policy (may or may not exist depending on PG behavior)
DROP POLICY IF EXISTS "Users insert own matches" ON squad_matches;
DROP POLICY IF EXISTS "System inserts matches" ON squad_matches;

-- Correct policy: only the initiator can create a match record,
-- and initiator cannot match themselves.
CREATE POLICY "Users insert own matches" ON squad_matches
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = initiator_id
    AND initiator_id <> target_id
  );
