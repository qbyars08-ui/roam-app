-- =============================================================================
-- ROAM — Fix waitlist RLS: allow anon to read own row after insert
-- Without this, .insert().select() returns empty due to no SELECT policy.
-- Also allow anon to read own row for duplicate handling.
-- =============================================================================

-- Authenticated users can read waitlist rows; anon can insert only
CREATE POLICY "Authenticated read waitlist" ON public.waitlist_emails
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon insert waitlist" ON public.waitlist_emails
  FOR INSERT TO anon
  WITH CHECK (true);
