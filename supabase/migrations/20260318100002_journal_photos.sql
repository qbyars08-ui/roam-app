-- =============================================================================
-- ROAM — Photo Journal: journal_photos table
-- =============================================================================

CREATE TABLE journal_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  trip_id uuid REFERENCES trips NOT NULL,
  uri text NOT NULL,
  day_index integer,
  location text,
  caption text,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journal_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own photos" ON journal_photos FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_journal_photos_trip ON journal_photos(trip_id);
