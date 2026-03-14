-- =============================================================================
-- ROAM — MEDIUM Security Fixes (SECURITY_AUDIT.md items 16, 17)
-- chaos_dares: add created_by, enforce ownership on INSERT
-- hostel_channels: add created_by, enforce ownership on INSERT
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. chaos_dares — add created_by, enforce WITH CHECK (created_by = auth.uid())
-- ---------------------------------------------------------------------------
ALTER TABLE chaos_dares
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Authenticated insert chaos dares" ON chaos_dares;
CREATE POLICY "Authenticated insert chaos dares" ON chaos_dares
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. hostel_channels — add created_by, enforce WITH CHECK (created_by = auth.uid())
-- ---------------------------------------------------------------------------
ALTER TABLE hostel_channels
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Authenticated insert hostel channels" ON hostel_channels;
DROP POLICY IF EXISTS "Authenticated insert hostel_channels" ON hostel_channels;
DROP POLICY IF EXISTS "Authenticated users create channels" ON hostel_channels;
CREATE POLICY "Authenticated users create channels" ON hostel_channels
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
