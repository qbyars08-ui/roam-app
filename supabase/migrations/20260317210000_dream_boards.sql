-- =============================================================================
-- ROAM — Dream Boards (save & manage future trip ideas)
-- =============================================================================

CREATE TABLE dream_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  destination text NOT NULL,
  title text,
  notes text,
  photo_url text,
  estimated_budget numeric,
  estimated_days integer,
  travel_month text,
  priority text DEFAULT 'someday' CHECK (priority IN ('next', 'soon', 'someday')),
  tags text[] DEFAULT '{}',
  inspiration_links text[] DEFAULT '{}',
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dream_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own dreams" ON dream_trips FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_dream_trips_user ON dream_trips(user_id);
