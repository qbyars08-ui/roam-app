-- =============================================================================
-- ROAM — Admin analytics: onboarding variant, placement for affiliate CTR
-- =============================================================================

-- Profiles: store onboarding variant for conversion analysis
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_variant TEXT DEFAULT 'default';

COMMENT ON COLUMN public.profiles.onboarding_variant IS
  'A/B test variant: default, minimal, social_proof, etc.';

-- Affiliate clicks: add placement/card_type for CTR by card
ALTER TABLE public.affiliate_clicks
  ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'unknown';

COMMENT ON COLUMN public.affiliate_clicks.placement IS
  'Card/screen where click occurred: booking_card, flight_card, itinerary, etc.';
