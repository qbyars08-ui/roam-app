-- =============================================================================
-- ROAM — People Social Layer
-- Tables: travel_profiles, destination_presence, connections
-- RLS policies + updated_at trigger + realtime on destination_presence
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. travel_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS travel_profiles (
  id                uuid        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name      text        NOT NULL,
  home_city         text,
  home_airport      text,                                    -- IATA code, e.g. 'LAX'
  travel_style      text[]      DEFAULT '{}',               -- freeform tags
  trips_completed   int         NOT NULL DEFAULT 0,
  countries_visited text[]      DEFAULT '{}',
  languages_spoken  text[]      DEFAULT '{}',
  bio               text        CHECK (bio IS NULL OR char_length(bio) <= 160),
  visible           boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_travel_profiles_visible
  ON travel_profiles(visible) WHERE visible = true;

-- updated_at auto-maintenance
CREATE OR REPLACE FUNCTION set_travel_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_travel_profiles_updated_at ON travel_profiles;
CREATE TRIGGER trg_travel_profiles_updated_at
  BEFORE UPDATE ON travel_profiles
  FOR EACH ROW EXECUTE FUNCTION set_travel_profile_updated_at();

-- ---------------------------------------------------------------------------
-- 2. destination_presence
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS destination_presence (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES travel_profiles(id) ON DELETE CASCADE,
  destination      text        NOT NULL,
  destination_code text,                                     -- IATA / city code
  arrival_date     date        NOT NULL,
  departure_date   date        NOT NULL,
  flexible_dates   boolean     NOT NULL DEFAULT false,
  visible          boolean     NOT NULL DEFAULT true,
  trip_id          uuid,                                     -- nullable FK to trips (if row exists)
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT destination_presence_dates_check
    CHECK (departure_date >= arrival_date)
);

CREATE INDEX IF NOT EXISTS idx_destination_presence_user
  ON destination_presence(user_id);

CREATE INDEX IF NOT EXISTS idx_destination_presence_dest_dates
  ON destination_presence(destination, arrival_date, departure_date)
  WHERE visible = true;

-- ---------------------------------------------------------------------------
-- 3. connections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connections (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user   uuid        NOT NULL REFERENCES travel_profiles(id) ON DELETE CASCADE,
  to_user     uuid        NOT NULL REFERENCES travel_profiles(id) ON DELETE CASCADE,
  status      text        NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  destination text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT connections_unique_pair UNIQUE (from_user, to_user),
  CONSTRAINT connections_no_self_connect CHECK (from_user <> to_user)
);

CREATE INDEX IF NOT EXISTS idx_connections_from_user
  ON connections(from_user);

CREATE INDEX IF NOT EXISTS idx_connections_to_user
  ON connections(to_user);

CREATE INDEX IF NOT EXISTS idx_connections_status_accepted
  ON connections(from_user, to_user) WHERE status = 'accepted';

-- ---------------------------------------------------------------------------
-- RLS — travel_profiles
-- ---------------------------------------------------------------------------
ALTER TABLE travel_profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read visible profiles
CREATE POLICY "travel_profiles_read_visible"
  ON travel_profiles
  FOR SELECT
  TO authenticated
  USING (visible = true);

-- Users can read their own profile regardless of visibility
CREATE POLICY "travel_profiles_read_own"
  ON travel_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "travel_profiles_insert_own"
  ON travel_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update only their own profile
CREATE POLICY "travel_profiles_update_own"
  ON travel_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can delete their own profile
CREATE POLICY "travel_profiles_delete_own"
  ON travel_profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS — destination_presence
-- ---------------------------------------------------------------------------
ALTER TABLE destination_presence ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read visible presence entries
CREATE POLICY "destination_presence_read_visible"
  ON destination_presence
  FOR SELECT
  TO authenticated
  USING (visible = true);

-- Users can read their own entries regardless of visibility
CREATE POLICY "destination_presence_read_own"
  ON destination_presence
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert only their own entries
CREATE POLICY "destination_presence_insert_own"
  ON destination_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update only their own entries
CREATE POLICY "destination_presence_update_own"
  ON destination_presence
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete only their own entries
CREATE POLICY "destination_presence_delete_own"
  ON destination_presence
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS — connections
-- ---------------------------------------------------------------------------
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can read any connection where they are a participant
CREATE POLICY "connections_read_participant"
  ON connections
  FOR SELECT
  TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());

-- Only the initiating user can insert a connection request
CREATE POLICY "connections_insert_as_from_user"
  ON connections
  FOR INSERT
  TO authenticated
  WITH CHECK (from_user = auth.uid());

-- Only the receiving user (to_user) can update status (accept / decline)
CREATE POLICY "connections_update_as_to_user"
  ON connections
  FOR UPDATE
  TO authenticated
  USING (to_user = auth.uid())
  WITH CHECK (to_user = auth.uid());

-- Either participant can delete (withdraw request or remove connection)
CREATE POLICY "connections_delete_participant"
  ON connections
  FOR DELETE
  TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime — destination_presence
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE destination_presence;
