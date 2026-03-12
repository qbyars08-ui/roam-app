-- =============================================================================
-- ROAM — Gamification Layer
-- Profiles stats, roamer ranks, achievements, weekly challenges, friends leaderboard
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profiles — add gamification columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS countries_visited INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS miles_traveled INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trips_planned_lifetime INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.countries_visited IS 'Distinct countries the user has visited';
COMMENT ON COLUMN public.profiles.miles_traveled IS 'Total miles traveled (cumulative)';
COMMENT ON COLUMN public.profiles.trips_planned_lifetime IS 'Total trips planned in ROAM (all time)';

-- ---------------------------------------------------------------------------
-- 2. Roamer ranks — user rank snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roamer_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank TEXT NOT NULL CHECK (rank IN ('explorer', 'wanderer', 'nomad', 'legend')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_roamer_ranks_user ON public.roamer_ranks(user_id);

ALTER TABLE public.roamer_ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own rank" ON public.roamer_ranks
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users update own rank" ON public.roamer_ranks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users upsert own rank" ON public.roamer_ranks
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access roamer_ranks" ON public.roamer_ranks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. Achievement definitions (read-only reference data)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  unlock_condition JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievement definitions" ON public.achievement_definitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access achievement_definitions" ON public.achievement_definitions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed 20 achievement definitions (matches lib/gamification.ts)
INSERT INTO public.achievement_definitions (id, name, description, icon, unlock_condition) VALUES
  ('first-trip', 'First Trip', 'Plan your first trip in ROAM', 'compass', '{"trips": 1}'),
  ('five-trips', 'Trip Planner', 'Plan 5 trips', 'map', '{"trips": 5}'),
  ('ten-trips', 'Frequent Planner', 'Plan 10 trips', 'star', '{"trips": 10}'),
  ('fifty-trips', 'Road Warrior', 'Plan 50 trips', 'badge', '{"trips": 50}'),
  ('first-country', 'First Stop', 'Visit your first country', 'flag', '{"countries": 1}'),
  ('five-countries', 'Continental', 'Visit 5 countries', 'globe', '{"countries": 5}'),
  ('ten-countries', 'World Traveler', 'Visit 10 countries', 'earth', '{"countries": 10}'),
  ('twenty-countries', 'Jet Setter', 'Visit 20 countries', 'airplane', '{"countries": 20}'),
  ('fifty-countries', 'Globetrotter', 'Visit 50 countries', 'trophy', '{"countries": 50}'),
  ('thousand-miles', '1K Miles', 'Travel 1,000 miles', 'road', '{"miles": 1000}'),
  ('ten-thousand-miles', '10K Miles', 'Travel 10,000 miles', 'route', '{"miles": 10000}'),
  ('fifty-thousand-miles', 'Sky King', 'Travel 50,000 miles', 'cloud', '{"miles": 50000}'),
  ('hundred-thousand-miles', 'Centurion', 'Travel 100,000 miles', 'crown', '{"miles": 100000}'),
  ('early-adopter', 'Early Bird', 'Plan a trip within 7 days of signup', 'sunrise', '{"days_since_signup": 7, "trips": 1}'),
  ('weekend-warrior', 'Weekend Warrior', 'Plan 3 weekend trips', 'calendar', '{"weekend_trips": 3}'),
  ('continent-hopper', 'Continent Hopper', 'Visit 3 different continents', 'compass-globe', '{"continents": 3}'),
  ('foodie', 'Foodie', 'Plan 5 food-focused trips', 'fork', '{"food_trips": 5}'),
  ('budget-master', 'Budget Master', 'Plan 10 budget trips under $50/day', 'wallet', '{"budget_trips": 10}'),
  ('streak-week', 'On a Roll', 'Plan a trip 5 days in a row', 'fire', '{"plan_streak": 5}'),
  ('legend-status', 'Legend', 'Reach Legend rank', 'medal', '{"rank": "legend"}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. User achievements (unlocked per user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_achievement_id ON public.achievements(achievement_id);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own achievements" ON public.achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert own achievements" ON public.achievements
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access achievements" ON public.achievements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. Weekly challenges
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type TEXT NOT NULL,
  description TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  target_value INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_challenges_dates ON public.weekly_challenges(starts_at, ends_at);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active weekly challenges" ON public.weekly_challenges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access weekly_challenges" ON public.weekly_challenges
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 6. Friends (for leaderboard)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_friends (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_social_friends_user ON public.social_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_social_friends_friend ON public.social_friends(friend_id);

ALTER TABLE public.social_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own friend list" ON public.social_friends
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see friends" ON public.social_friends
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Service role full access social_friends" ON public.social_friends
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 7. Friends leaderboard function (by countries_visited)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_friends_leaderboard(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  rank_ordinal BIGINT,
  countries_visited INT,
  miles_traveled INT,
  trips_planned_lifetime INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    ROW_NUMBER() OVER (ORDER BY p.countries_visited DESC, p.miles_traveled DESC)::BIGINT AS rank_ordinal,
    p.countries_visited,
    p.miles_traveled,
    p.trips_planned_lifetime
  FROM public.profiles p
  WHERE p.id = p_user_id
     OR p.id IN (
       SELECT f.friend_id FROM public.social_friends f WHERE f.user_id = p_user_id
       UNION
       SELECT f.user_id FROM public.social_friends f WHERE f.friend_id = p_user_id
     )
  ORDER BY p.countries_visited DESC, p.miles_traveled DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS: callable by authenticated users only (returns data filtered by p_user_id)
GRANT EXECUTE ON FUNCTION public.get_friends_leaderboard(UUID) TO authenticated;
