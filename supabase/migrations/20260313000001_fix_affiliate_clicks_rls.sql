-- =============================================================================
-- ROAM — Fix affiliate_clicks RLS: drop overly permissive policies
-- The original migration allowed anon + authenticated inserts with no user check.
-- This migration drops those and ensures only the tight policy remains.
-- =============================================================================

-- Drop the dangerously permissive policies from the first migration
DROP POLICY IF EXISTS "Users can insert affiliate clicks" ON affiliate_clicks;
DROP POLICY IF EXISTS "Anon can insert affiliate clicks" ON affiliate_clicks;

-- Ensure the correct tight policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'affiliate_clicks'
      AND policyname = 'Users can insert own clicks'
  ) THEN
    CREATE POLICY "Users can insert own clicks" ON affiliate_clicks
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Add length + scheme constraints to url column (safe if column doesn't exist yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'url'
  ) THEN
    ALTER TABLE affiliate_clicks
      ADD CONSTRAINT affiliate_clicks_url_length CHECK (length(url) <= 2048);
  END IF;
END
$$;

-- Add length constraint to destination column
DO $$
BEGIN
  ALTER TABLE affiliate_clicks
    ADD CONSTRAINT affiliate_clicks_dest_length CHECK (length(destination) <= 200);
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;
