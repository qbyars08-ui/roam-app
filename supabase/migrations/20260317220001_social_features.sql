-- =============================================================================
-- ROAM — Social Features: Trip Check-ins + Traveler Connections
-- =============================================================================

-- ---------------------------------------------------------------------------
-- trip_check_ins — "I'm here right now" presence for solo traveler meetups
-- ---------------------------------------------------------------------------
CREATE TABLE trip_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  trip_id uuid references trips,
  destination text not null,
  neighborhood text,
  check_in_message text,
  looking_for text, -- 'food buddy', 'explore partner', 'nightlife', 'coworking'
  visible_until timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

-- RLS: users can see check-ins where destination matches (case-insensitive)
-- and visible_until is in the future. Users manage their own rows.
ALTER TABLE trip_check_ins ENABLE ROW LEVEL SECURITY;

-- Users see all active check-ins (for "Who's here" feed)
CREATE POLICY "Active check-ins visible to all authenticated users"
  ON trip_check_ins FOR SELECT
  TO authenticated
  USING (visible_until > now());

-- Users can insert their own check-ins
CREATE POLICY "Users insert own check-ins"
  ON trip_check_ins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-ins
CREATE POLICY "Users update own check-ins"
  ON trip_check_ins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own check-ins
CREATE POLICY "Users delete own check-ins"
  ON trip_check_ins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- traveler_connections — connection requests between travelers
-- ---------------------------------------------------------------------------
CREATE TABLE traveler_connections (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references auth.users not null,
  to_user uuid references auth.users not null,
  status text default 'pending', -- pending, accepted, declined
  message text,
  created_at timestamptz default now()
);

ALTER TABLE traveler_connections ENABLE ROW LEVEL SECURITY;

-- Users see connections where they are sender or receiver
CREATE POLICY "Users see their own connections"
  ON traveler_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user);

-- Users can create connection requests
CREATE POLICY "Users insert own connection requests"
  ON traveler_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user);

-- Users can update connections where they are involved (accept/decline)
CREATE POLICY "Users update own connections"
  ON traveler_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user)
  WITH CHECK (auth.uid() = from_user OR auth.uid() = to_user);

-- ---------------------------------------------------------------------------
-- Performance indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_trip_check_ins_destination
  ON trip_check_ins (lower(destination));

CREATE INDEX IF NOT EXISTS idx_trip_check_ins_visible_until
  ON trip_check_ins (visible_until);

CREATE INDEX IF NOT EXISTS idx_trip_check_ins_user_id
  ON trip_check_ins (user_id);

CREATE INDEX IF NOT EXISTS idx_traveler_connections_from_user
  ON traveler_connections (from_user);

CREATE INDEX IF NOT EXISTS idx_traveler_connections_to_user
  ON traveler_connections (to_user);
