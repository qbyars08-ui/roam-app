-- =============================================================================
-- ROAM — Performance indexes for common query patterns
-- =============================================================================

-- profiles: filter by subscription_tier for admin stats
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier);

-- analytics_events: compound index for user-specific event queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created ON analytics_events(user_id, created_at DESC);
