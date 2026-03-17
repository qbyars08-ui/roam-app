-- =============================================================================
-- ROAM — craft_sessions: CRAFT mode conversation + personalized itinerary
-- =============================================================================

CREATE TABLE IF NOT EXISTS craft_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination text,
  conversation jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_itinerary jsonb,
  preferences_captured jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_craft_sessions_user_id ON craft_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_craft_sessions_updated_at ON craft_sessions(updated_at DESC);

ALTER TABLE craft_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own craft_sessions"
  ON craft_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own craft_sessions"
  ON craft_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own craft_sessions"
  ON craft_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own craft_sessions"
  ON craft_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION craft_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER craft_sessions_updated_at
  BEFORE UPDATE ON craft_sessions
  FOR EACH ROW EXECUTE FUNCTION craft_sessions_updated_at();

COMMENT ON TABLE craft_sessions IS 'CRAFT mode: full conversation + generated itinerary per user';
