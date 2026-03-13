-- =============================================================================
-- ROAM — Lock chaos_dares INSERT to authenticated users only
-- Previously "Anyone can insert chaos dares" allowed unauthenticated writes,
-- enabling spam/abuse of shared dare links.
-- SELECT remains public so recipients can view shared dares without logging in.
-- =============================================================================

-- Drop the permissive insert policy
DROP POLICY IF EXISTS "Anyone can insert chaos dares" ON chaos_dares;

-- Require auth for inserts
CREATE POLICY "Authenticated users can insert chaos dares"
  ON chaos_dares
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
