-- =============================================================================
-- ROAM — Add travel_profile JSONB column to profiles table
-- Stores the Travel Style Profile (pace, budget_style, transport, crowd,
-- food_adventurousness, accommodation, trip_purposes)
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS travel_profile JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.travel_profile IS
  'Travel Style Profile JSON: { pace, budgetStyle, transport[], crowdTolerance, foodAdventurousness, accommodation, tripPurposes[] }';
