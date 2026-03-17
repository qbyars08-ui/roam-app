-- Trip moments — user-captured memories during travel
CREATE TABLE IF NOT EXISTS trip_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  trip_id uuid REFERENCES trips(id),
  note text NOT NULL,
  photo_url text,
  location text,
  destination text,
  created_at timestamptz DEFAULT now()
);

-- Trip journals — auto-generated travel stories
CREATE TABLE IF NOT EXISTS trip_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  trip_id uuid REFERENCES trips(id),
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE trip_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own moments" ON trip_moments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own journals" ON trip_journals FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_trip_moments_user ON trip_moments(user_id);
CREATE INDEX idx_trip_moments_trip ON trip_moments(trip_id);
CREATE INDEX idx_trip_journals_user ON trip_journals(user_id);
CREATE INDEX idx_trip_journals_trip ON trip_journals(trip_id);
