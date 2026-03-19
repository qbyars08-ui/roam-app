-- =============================================================================
-- ROAM — Trip Sharing & DNA Matching
-- Adds public trip sharing and trip DNA columns to the trips table
-- =============================================================================

-- 1. Add is_public flag (opt-in, defaults to false)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 2. Add trip_dna JSONB column for matching algorithm
--    Schema: { destination, budget_tier, pace, style, duration, solo_vs_group, season }
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_dna JSONB;

-- 3. Composite index for efficient matching queries on public trips by destination
CREATE INDEX IF NOT EXISTS idx_trips_public_destination
  ON trips (destination)
  WHERE is_public = true;

-- 4. Index for trip_dna queries (GIN for JSONB containment queries)
CREATE INDEX IF NOT EXISTS idx_trips_dna_gin
  ON trips USING gin (trip_dna)
  WHERE is_public = true;

-- 5. RLS — anyone can read public trips (for DNA matching discovery)
CREATE POLICY "Anyone can read public trips"
  ON trips FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- 6. Only the trip owner can toggle is_public
CREATE POLICY "Owner can update trip sharing"
  ON trips FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Create trip_moments table if not already created by travel_memory migration
-- (Safe: IF NOT EXISTS prevents duplicate creation)
CREATE TABLE IF NOT EXISTS trip_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  photo_url TEXT,
  location TEXT,
  destination TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  weather_icon TEXT,
  weather_temp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trip_moments ENABLE ROW LEVEL SECURITY;

-- Public moments for public trips (read-only)
CREATE POLICY "Anyone can read moments of public trips"
  ON trip_moments FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_moments.trip_id
      AND trips.is_public = true
    )
  );
