-- =============================================================================
-- ROAM — People Tab Security Fixes (2026-03-15)
-- 1. shared_trips: add DELETE policy so creators can retract share links
-- 2. social_profiles: add DB-level length constraints to prevent oversized inputs
-- 3. trip_presence: add insert limit trigger (max 10 active per user)
-- 4. get_group_preview_by_invite: revoke anon grant, require auth
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. shared_trips — allow creator to delete their own shared trips
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can delete own shared trips" ON shared_trips
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. social_profiles — add length constraints on free-text fields
--    Prevents oversized bio/display_name payloads and XSS content storage
-- ---------------------------------------------------------------------------
ALTER TABLE social_profiles
  ADD CONSTRAINT bio_max_length
    CHECK (bio IS NULL OR char_length(bio) <= 300),
  ADD CONSTRAINT display_name_max_length
    CHECK (char_length(display_name) <= 50);

-- Limit vibe_tags array to 10 entries
ALTER TABLE social_profiles
  ADD CONSTRAINT vibe_tags_max_count
    CHECK (array_length(vibe_tags, 1) IS NULL OR array_length(vibe_tags, 1) <= 10);

-- Limit languages array to 10 entries
ALTER TABLE social_profiles
  ADD CONSTRAINT languages_max_count
    CHECK (array_length(languages, 1) IS NULL OR array_length(languages, 1) <= 10);

-- ---------------------------------------------------------------------------
-- 3. trip_presence — limit to 10 active presences per user (prevents spam)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_presence_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM trip_presence
    WHERE user_id = NEW.user_id
      AND status = 'active'
  ) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 active trip presences allowed per user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_presence_limit ON trip_presence;
CREATE TRIGGER enforce_presence_limit
  BEFORE INSERT ON trip_presence
  FOR EACH ROW
  EXECUTE FUNCTION check_presence_limit();

-- ---------------------------------------------------------------------------
-- 4. get_group_preview_by_invite — revoke anon access
--    Unauthenticated callers should not receive full itinerary_json
--    Deferred-signup flow still works: users authenticate before joining
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION get_group_preview_by_invite(text) FROM anon;
-- Authenticated users retain access
-- GRANT EXECUTE ON FUNCTION get_group_preview_by_invite(text) TO authenticated; -- already granted
