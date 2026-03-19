-- =============================================================================
-- ROAM — Group Trip Collaborators, Activity Votes, Trip Invites
-- Direct trip-level collaboration (complements existing trip_groups system)
-- =============================================================================

-- Trip Collaborators — who has access to a trip
CREATE TABLE IF NOT EXISTS trip_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'editor',
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;

-- Collaborators can see trips they are part of
CREATE POLICY "Collaborators can view their trips"
  ON trip_collaborators FOR SELECT
  USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

-- Authenticated users can insert themselves (via invite flow)
CREATE POLICY "Users can join as collaborator"
  ON trip_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owners can remove collaborators
CREATE POLICY "Owners can delete collaborators"
  ON trip_collaborators FOR DELETE
  USING (
    trip_id IN (
      SELECT trip_id FROM trip_collaborators
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Activity Votes — thumbs up/down on itinerary activities
CREATE TABLE IF NOT EXISTS activity_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_index int NOT NULL,
  slot text CHECK (slot IN ('morning', 'afternoon', 'evening')) NOT NULL,
  vote text CHECK (vote IN ('up', 'down')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, user_id, day_index, slot)
);

ALTER TABLE activity_votes ENABLE ROW LEVEL SECURITY;

-- Voters see votes on trips they collaborate on
CREATE POLICY "Collaborators can view votes"
  ON activity_votes FOR SELECT
  USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "Collaborators can vote"
  ON activity_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own votes"
  ON activity_votes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own votes"
  ON activity_votes FOR DELETE
  USING (user_id = auth.uid());

-- Trip Invites — shareable invite codes with expiry and usage limits
CREATE TABLE IF NOT EXISTS trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  max_uses int DEFAULT 10,
  uses int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_invites ENABLE ROW LEVEL SECURITY;

-- Invite creators manage their own invites
CREATE POLICY "Creators can manage invites"
  ON trip_invites FOR ALL
  USING (created_by = auth.uid());

-- Anyone authenticated can read invites (needed for join flow validation)
CREATE POLICY "Authenticated users can read invites"
  ON trip_invites FOR SELECT
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_trip ON trip_collaborators(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_user ON trip_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_votes_trip ON activity_votes(trip_id);
CREATE INDEX IF NOT EXISTS idx_activity_votes_trip_day ON activity_votes(trip_id, day_index);
CREATE INDEX IF NOT EXISTS idx_trip_invites_code ON trip_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_trip_invites_trip ON trip_invites(trip_id);
