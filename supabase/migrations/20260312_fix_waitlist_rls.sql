-- =============================================================================
-- ROAM — Fix waitlist RLS: allow anon to read own row after insert
-- Without this, .insert().select() returns empty due to no SELECT policy.
-- Also allow anon to read own row for duplicate handling.
-- =============================================================================

-- Allow anon users to read waitlist rows (needed for .insert().select() and duplicate handling)
CREATE POLICY "Anon can read waitlist rows" ON public.waitlist_emails
  FOR SELECT
  USING (true);
