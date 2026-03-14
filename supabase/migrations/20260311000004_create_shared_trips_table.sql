-- =============================================================================
-- ROAM — Shared Trips table for deep link sharing
-- =============================================================================

-- Public table storing shared trip data accessible via UUID deep links
CREATE TABLE IF NOT EXISTS shared_trips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  days        INT NOT NULL DEFAULT 7,
  budget      TEXT NOT NULL DEFAULT '',
  vibes       TEXT[] NOT NULL DEFAULT '{}',
  itinerary   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Anyone can read shared trips (public links)
ALTER TABLE shared_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared trips"
  ON shared_trips FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert shared trips"
  ON shared_trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for fast UUID lookups
CREATE INDEX IF NOT EXISTS idx_shared_trips_id ON shared_trips (id);
