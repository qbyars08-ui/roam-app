-- =============================================================================
-- ROAM — Streak System: daily opens, trips planned, countries visited
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_daily_opens INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_last_open_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_trips_planned INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_countries_visited INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_push_enabled BOOLEAN NOT NULL DEFAULT true;
